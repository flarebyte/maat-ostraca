import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { runCli } from '../src/cmd/maat/cli.js';
import { JsonErrorOutputSchema } from '../src/core/contracts/schemas.js';
import { InternalError } from '../src/core/errors/index.js';
import { runAnalyse } from '../src/core/run-analyse.js';
import { runRulesList } from '../src/core/run-rules-list.js';
import { resolveSource } from '../src/core/source/resolve.js';
import { resolveDiffSource } from '../src/core/source/resolve-diff.js';
import { resolveRules } from '../src/rules/index.js';

interface CliRunResult {
  code: number;
  stdout: string;
  stderr: string;
}

type CliDeps = NonNullable<Parameters<typeof runCli>[2]>;

const defaultDeps: CliDeps = {
  runAnalyse,
  runRulesList,
  resolveRules,
  resolveSource,
  resolveDiffSource,
};

const runCliWithCapture = async (
  args: string[],
  deps: CliDeps = defaultDeps,
): Promise<CliRunResult> => {
  let stdout = '';
  let stderr = '';
  const code = await runCli(
    args,
    {
      stdout: (message: string) => {
        stdout += message;
      },
      stderr: (message: string) => {
        stderr += message;
      },
    },
    deps,
  );

  return { code, stdout, stderr };
};

const runTwice = async (
  args: string[],
  deps: CliDeps = defaultDeps,
): Promise<{ first: CliRunResult; second: CliRunResult }> => {
  const first = await runCliWithCapture(args, deps);
  const second = await runCliWithCapture(args, deps);
  return { first, second };
};

const parseJsonError = (output: string) => {
  const payload = JSON.parse(output) as unknown;
  const parsed = JsonErrorOutputSchema.safeParse(payload);
  assert.equal(parsed.success, true);
  if (!parsed.success) {
    throw new Error('JsonErrorOutputSchema parse failed');
  }
  return parsed.data;
};

const assertUsageTextContract = async (
  args: string[],
  expectedStderr: string,
): Promise<void> => {
  const { first, second } = await runTwice(args);

  assert.equal(first.code, 2);
  assert.equal(second.code, 2);
  assert.equal(first.stdout, '');
  assert.equal(second.stdout, '');
  assert.equal(first.stderr, expectedStderr);
  assert.equal(first.stderr, second.stderr);
};

const assertUsageJsonContract = async (args: string[]): Promise<void> => {
  const { first, second } = await runTwice(args);

  assert.equal(first.code, 2);
  assert.equal(second.code, 2);
  assert.equal(first.stderr, '');
  assert.equal(second.stderr, '');
  assert.equal(first.stdout, second.stdout);
  parseJsonError(first.stdout);
};

const assertInternalJsonContract = async (
  args: string[],
  deps: CliDeps,
): Promise<void> => {
  const result = await runCliWithCapture(args, deps);

  assert.equal(result.code, 1);
  assert.equal(result.stderr, '');
  const errorPayload = parseJsonError(result.stdout);
  assert.equal(errorPayload.error.code, 'E_INTERNAL');
  assert.equal(errorPayload.error.message, 'forced internal');
};

describe('cli error contract', () => {
  it('analyse usage error without --json routes to stderr with exit 2 and deterministic bytes', async () => {
    await assertUsageTextContract(
      ['analyse', '--rules', 'does_not_exist', '--language', 'typescript'],
      'unknown rule "does_not_exist" for language "typescript"\n',
    );
  });

  it('analyse usage error with --json routes to stdout envelope with exit 2 and deterministic bytes', async () => {
    await assertUsageJsonContract([
      'analyse',
      '--rules',
      'does_not_exist',
      '--language',
      'typescript',
      '--json',
    ]);
  });

  it('analyse internal error with --json exits 1 and routes envelope to stdout only', async () => {
    await assertInternalJsonContract(
      ['analyse', '--rules', 'code_hash', '--language', 'typescript', '--json'],
      {
        ...defaultDeps,
        runAnalyse: async () => {
          throw new InternalError('forced internal');
        },
        resolveSource: async () => ({
          source: 'const a = 1;\n',
          language: 'typescript',
        }),
      },
    );
  });

  it('diff usage error without --json routes to stderr with exit 2 and deterministic bytes', async () => {
    await assertUsageTextContract(
      [
        'diff',
        '--from',
        'missing.ts',
        '--rules',
        'import_files_list',
        '--language',
        'typescript',
      ],
      'file_read_error: cannot read "missing.ts"\n',
    );
  });

  it('diff usage error with --json routes to stdout envelope with exit 2 and deterministic bytes', async () => {
    await assertUsageJsonContract([
      'diff',
      '--from',
      'missing.ts',
      '--rules',
      'import_files_list',
      '--language',
      'typescript',
      '--json',
    ]);
  });

  it('diff internal error with --json exits 1 and routes envelope to stdout only', async () => {
    await assertInternalJsonContract(
      [
        'diff',
        '--from',
        'a.ts',
        '--rules',
        'code_hash',
        '--language',
        'typescript',
        '--json',
      ],
      {
        ...defaultDeps,
        runAnalyse: async () => {
          throw new InternalError('forced internal');
        },
        resolveDiffSource: async () => ({
          fromFilename: 'a.ts',
          fromSource: 'export const a = 1;\n',
          toSource: 'export const a = 2;\n',
          language: 'typescript',
        }),
      },
    );
  });

  it('rules usage error without --json routes to stderr with exit 2 and deterministic bytes', async () => {
    await assertUsageTextContract(
      ['rules', '--language', 'invalid'],
      "error: option '--language <go|typescript|dart>' argument 'invalid' is invalid. language must be one of: go, typescript, dart\n",
    );
  });

  it('rules usage error with --json routes to stdout envelope with exit 2 and deterministic bytes', async () => {
    await assertUsageJsonContract(['rules', '--language', 'invalid', '--json']);
  });

  it('rules internal error with --json exits 1 and routes envelope to stdout only', async () => {
    await assertInternalJsonContract(
      ['rules', '--language', 'typescript', '--json'],
      {
        ...defaultDeps,
        runRulesList: async () => {
          throw new InternalError('forced internal');
        },
      },
    );
  });
});
