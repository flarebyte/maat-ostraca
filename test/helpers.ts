import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { it } from 'node:test';
import type { AnalyseOutput } from '../src/core/contracts/outputs.js';
import { diffResults } from '../src/core/diff/index.js';
import { canonicalStringify } from '../src/core/format/canonical-json.js';

export const expectDeterministicStringList = async (
  runRule: () => Promise<string[]>,
  expected: string[],
) => {
  const first = await runRule();
  const second = await runRule();

  assert.deepEqual(first, expected);
  assert.equal(canonicalStringify(first), canonicalStringify(second));
};

export const expectCanonicalDeterminism = async <T>(
  runRule: () => Promise<T>,
): Promise<{ first: T; second: T }> => {
  const first = await runRule();
  const second = await runRule();
  assert.equal(canonicalStringify(first), canonicalStringify(second));
  return { first, second };
};

export const readFixture = (path: string): string => {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
};

export const expectRuleOutput = async <T>(
  runRule: (input: { source: string; language: string }) => Promise<T>,
  input: { source: string; language: string },
  expected: T,
) => {
  const result = await runRule(input);
  assert.deepEqual(result, expected);
};

export const expectFixtureRuleOutput = async <T>(
  runRule: (input: { source: string; language: string }) => Promise<T>,
  fixturePath: string,
  language: string,
  expected: T,
) => {
  await expectRuleOutput(
    runRule,
    { source: readFixture(fixturePath), language },
    expected,
  );
};

export const baseAnalyseOutput = (
  filename: string,
  language: AnalyseOutput['language'],
  rules: Record<string, unknown>,
): AnalyseOutput => ({
  filename,
  language,
  rules,
});

export const expectCodeHashDiffShapes = (
  from: AnalyseOutput,
  to: AnalyseOutput,
  expectedRegular: Record<string, unknown>,
  expectedDeltaOnly: Record<string, unknown>,
) => {
  const regular = diffResults(from, to, {});
  const delta = diffResults(from, to, { deltaOnly: true });

  assert.deepEqual(regular.rules.code_hash, expectedRegular);
  assert.deepEqual(delta.rules.code_hash, expectedDeltaOnly);
};

export const expectFileMetricsDiff = (
  from: AnalyseOutput,
  to: AnalyseOutput,
  options: { deltaOnly?: boolean },
  expected: Record<string, unknown>,
) => {
  const diff = diffResults(from, to, options);
  assert.deepEqual(diff.rules.file_metrics, expected);
};

export const expectKnownCodeHashOutputs = async (
  entries: ReadonlyArray<{
    runRule: (input: { source: string; language: string }) => Promise<unknown>;
    input: { source: string; language: string };
    expected: unknown;
  }>,
) => {
  for (const entry of entries) {
    const result = await entry.runRule(entry.input);
    assert.deepEqual(result, entry.expected);
  }
};

export const registerCodeHashDiffShapeTests = (
  filename: string,
  language: AnalyseOutput['language'],
) => {
  it('diff integration produces standard hash diff shape', () => {
    const from = baseAnalyseOutput(filename, language, {
      code_hash: { algorithm: 'sha256', file: 'abc' },
    });
    const to = baseAnalyseOutput(filename, language, {
      code_hash: { algorithm: 'sha256', file: 'def' },
    });
    expectCodeHashDiffShapes(
      from,
      to,
      {
        from: 'abc',
        to: 'def',
        changed: true,
      },
      { changed: true },
    );
  });

  it('diff integration produces unchanged and delta-only hash shapes', () => {
    const from = baseAnalyseOutput(filename, language, {
      code_hash: { algorithm: 'sha256', file: 'same' },
    });
    const to = baseAnalyseOutput(filename, language, {
      code_hash: { algorithm: 'sha256', file: 'same' },
    });
    expectCodeHashDiffShapes(
      from,
      to,
      {
        from: 'same',
        to: 'same',
        changed: false,
      },
      { changed: false },
    );
  });
};

export const registerFileMetricsDiffTests = (
  filename: string,
  language: AnalyseOutput['language'],
) => {
  it(`diff integration builds numeric deltas for ${language} file_metrics fields`, () => {
    const from = baseAnalyseOutput(filename, language, {
      file_metrics: {
        loc: 10,
        sloc: 8,
        tokens: 20,
        loops: 1,
        conditions: 2,
        cyclomaticComplexity: 4,
        cognitiveComplexity: 4,
        maxNestingDepth: 2,
      },
    });
    const to = baseAnalyseOutput(filename, language, {
      file_metrics: {
        loc: 13,
        sloc: 10,
        tokens: 29,
        loops: 3,
        conditions: 4,
        cyclomaticComplexity: 8,
        cognitiveComplexity: 8,
        maxNestingDepth: 3,
      },
    });

    expectFileMetricsDiff(
      from,
      to,
      {},
      {
        cognitiveComplexity: { from: 4, to: 8, delta: 4 },
        conditions: { from: 2, to: 4, delta: 2 },
        cyclomaticComplexity: { from: 4, to: 8, delta: 4 },
        loc: { from: 10, to: 13, delta: 3 },
        loops: { from: 1, to: 3, delta: 2 },
        maxNestingDepth: { from: 2, to: 3, delta: 1 },
        sloc: { from: 8, to: 10, delta: 2 },
        tokens: { from: 20, to: 29, delta: 9 },
      },
    );
  });

  it(`diff integration delta-only returns numeric deltas for ${language} file_metrics`, () => {
    const from = baseAnalyseOutput(filename, language, {
      file_metrics: {
        loc: 2,
        sloc: 2,
        tokens: 6,
        loops: 0,
        conditions: 1,
        cyclomaticComplexity: 2,
        cognitiveComplexity: 2,
        maxNestingDepth: 1,
      },
    });
    const to = baseAnalyseOutput(filename, language, {
      file_metrics: {
        loc: 5,
        sloc: 4,
        tokens: 11,
        loops: 1,
        conditions: 3,
        cyclomaticComplexity: 5,
        cognitiveComplexity: 5,
        maxNestingDepth: 2,
      },
    });

    expectFileMetricsDiff(
      from,
      to,
      { deltaOnly: true },
      {
        cognitiveComplexity: 3,
        conditions: 2,
        cyclomaticComplexity: 3,
        loc: 3,
        loops: 1,
        maxNestingDepth: 1,
        sloc: 2,
        tokens: 5,
      },
    );
  });
};

export const EXPECTED_TYPESCRIPT_CODE_HASH = {
  algorithm: 'sha256',
  file: 'b79b14bd2584dd52b0f0ef042a2a4f104cda48330500e12237737cc51fbda43d',
} as const;

export const EXPECTED_GO_CODE_HASH = {
  algorithm: 'sha256',
  file: '55a60bb97151b2b4b680462447ce60ec34511b14fa10d77440c97b9777101566',
} as const;

export const EXPECTED_EMPTY_CODE_HASH = {
  algorithm: 'sha256',
  file: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
} as const;
