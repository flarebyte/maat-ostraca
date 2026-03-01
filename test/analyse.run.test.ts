import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { InternalError } from '../src/core/errors/index.js';
import { canonicalStringify } from '../src/core/format/canonical-json.js';
import { runAnalyse } from '../src/core/run-analyse.js';
import type { Language } from '../src/core/types.js';
import type { RuleRunInput, RuleRunner } from '../src/rules/dispatch.js';
import type { RuleName } from '../src/rules/index.js';

const SOURCE = 'import z from "z";\nimport a from "a";\n\nconst value = 1;\n';
const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const fakeRuleResult = (ruleName: RuleName): unknown => {
  if (ruleName === 'code_hash') {
    return {
      algorithm: 'sha256',
      file: 'abc',
    };
  }

  if (ruleName === 'file_metrics') {
    return {
      loc: 10,
      sloc: 8,
      cyclomaticComplexity: 2,
      cognitiveComplexity: 3,
      maxNestingDepth: 1,
      tokens: 30,
      loops: 1,
      conditions: 2,
    };
  }

  if (ruleName === 'import_files_list') {
    return ['z', 'a'];
  }

  if (ruleName === 'package_imports_list') {
    return ['pkg-z', 'pkg-a'];
  }

  return {
    ok: ruleName,
  };
};

const createDispatch = (args: {
  delays: Partial<Record<RuleName, number>>;
  failing?: ReadonlySet<RuleName>;
}) => {
  return async (
    ruleName: RuleName,
    _language: Language,
  ): Promise<RuleRunner> => {
    return async (_input: RuleRunInput): Promise<unknown> => {
      await sleep(args.delays[ruleName] ?? 0);

      if (args.failing?.has(ruleName)) {
        throw new Error(`boom:${ruleName}`);
      }

      return fakeRuleResult(ruleName);
    };
  };
};

describe('runAnalyse orchestrator', () => {
  it('aggregates multiple rules keyed by deterministic rule order', async () => {
    const output = await runAnalyse({
      source: SOURCE,
      language: 'typescript',
      rules: ['import_files_list', 'file_metrics', 'code_hash'],
    });

    assert.deepEqual(Object.keys(output.rules), [
      'code_hash',
      'file_metrics',
      'import_files_list',
    ]);
  });

  it('sorts list outputs and returns stable file_metrics values', async () => {
    const output = await runAnalyse({
      source: SOURCE,
      language: 'typescript',
      rules: ['import_files_list', 'file_metrics'],
    });

    assert.deepEqual(output.rules.import_files_list, ['a', 'z']);
    assert.deepEqual(output.rules.file_metrics, {
      loc: 5,
      sloc: 3,
      tokens: 19,
      loops: 0,
      conditions: 0,
      cyclomaticComplexity: 1,
      cognitiveComplexity: 1,
      maxNestingDepth: 0,
    });
  });

  it('code_hash output is stable for known source input', async () => {
    const output = await runAnalyse({
      source: SOURCE,
      language: 'typescript',
      rules: ['code_hash'],
    });

    assert.deepEqual(output.rules.code_hash, {
      algorithm: 'sha256',
      file: '41b3579e2e4135333d41edacbb97113d360564c72f4cddef15c4d558a954dac9',
    });
  });

  it('is byte-identical across concurrency=1 and concurrency=4 with different delays', async () => {
    const rules: RuleName[] = [
      'import_files_list',
      'file_metrics',
      'code_hash',
      'package_imports_list',
    ];
    const args = {
      source: SOURCE,
      language: 'typescript' as const,
      rules,
    };

    const sequential = await runAnalyse(args, {
      concurrency: 1,
      dispatch: createDispatch({
        delays: {
          import_files_list: 20,
          file_metrics: 10,
          code_hash: 5,
          package_imports_list: 0,
        },
      }),
    });

    const parallel = await runAnalyse(args, {
      concurrency: 4,
      dispatch: createDispatch({
        delays: {
          import_files_list: 1,
          file_metrics: 25,
          code_hash: 2,
          package_imports_list: 15,
        },
      }),
    });

    assert.equal(canonicalStringify(sequential), canonicalStringify(parallel));
    assert.deepEqual(Object.keys(parallel.rules), [
      'code_hash',
      'file_metrics',
      'import_files_list',
      'package_imports_list',
    ]);
  });

  it('selects deterministic failing rule regardless of delay ordering', async () => {
    const rules: RuleName[] = ['file_metrics', 'code_hash'];
    const failing = new Set<RuleName>(rules);
    const args = {
      source: SOURCE,
      language: 'typescript' as const,
      rules,
    };

    await assert.rejects(
      runAnalyse(args, {
        concurrency: 2,
        dispatch: createDispatch({
          delays: {
            code_hash: 20,
            file_metrics: 1,
          },
          failing,
        }),
      }),
      (error: unknown) => {
        assert.ok(error instanceof InternalError);
        assert.equal(
          error.message,
          'rule_execution_error: code_hash for language "typescript"',
        );
        return true;
      },
    );

    await assert.rejects(
      runAnalyse(args, {
        concurrency: 2,
        dispatch: createDispatch({
          delays: {
            code_hash: 1,
            file_metrics: 20,
          },
          failing,
        }),
      }),
      (error: unknown) => {
        assert.ok(error instanceof InternalError);
        assert.equal(
          error.message,
          'rule_execution_error: code_hash for language "typescript"',
        );
        return true;
      },
    );
  });
});
