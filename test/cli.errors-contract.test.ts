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

interface IoCapture {
  stdout: string;
  stderr: string;
}

const createIoCapture = (): {
  io: { stdout: (message: string) => void; stderr: (message: string) => void };
  get: () => IoCapture;
} => {
  let stdout = '';
  let stderr = '';

  return {
    io: {
      stdout: (message: string) => {
        stdout += message;
      },
      stderr: (message: string) => {
        stderr += message;
      },
    },
    get: () => ({ stdout, stderr }),
  };
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

describe('cli error contract', () => {
  it('analyse usage error without --json routes to stderr with exit 2 and deterministic bytes', async () => {
    const firstCapture = createIoCapture();
    const secondCapture = createIoCapture();

    const firstCode = await runCli(
      ['analyse', '--rules', 'does_not_exist', '--language', 'typescript'],
      firstCapture.io,
    );
    const secondCode = await runCli(
      ['analyse', '--rules', 'does_not_exist', '--language', 'typescript'],
      secondCapture.io,
    );

    const first = firstCapture.get();
    const second = secondCapture.get();

    assert.equal(firstCode, 2);
    assert.equal(secondCode, 2);
    assert.equal(first.stdout, '');
    assert.equal(second.stdout, '');
    assert.equal(
      first.stderr,
      'unknown rule "does_not_exist" for language "typescript"\n',
    );
    assert.equal(first.stderr, second.stderr);
  });

  it('analyse usage error with --json routes to stdout envelope with exit 2 and deterministic bytes', async () => {
    const firstCapture = createIoCapture();
    const secondCapture = createIoCapture();

    const firstCode = await runCli(
      [
        'analyse',
        '--rules',
        'does_not_exist',
        '--language',
        'typescript',
        '--json',
      ],
      firstCapture.io,
    );
    const secondCode = await runCli(
      [
        'analyse',
        '--rules',
        'does_not_exist',
        '--language',
        'typescript',
        '--json',
      ],
      secondCapture.io,
    );

    const first = firstCapture.get();
    const second = secondCapture.get();

    assert.equal(firstCode, 2);
    assert.equal(secondCode, 2);
    assert.equal(first.stderr, '');
    assert.equal(second.stderr, '');
    assert.equal(first.stdout, second.stdout);
    parseJsonError(first.stdout);
  });

  it('analyse internal error with --json exits 1 and routes envelope to stdout only', async () => {
    const capture = createIoCapture();

    const code = await runCli(
      ['analyse', '--rules', 'code_hash', '--language', 'typescript', '--json'],
      capture.io,
      {
        runAnalyse: async () => {
          throw new InternalError('forced internal');
        },
        runRulesList,
        resolveRules,
        resolveSource: async () => ({
          source: 'const a = 1;\n',
          language: 'typescript',
        }),
        resolveDiffSource,
      },
    );

    const { stdout, stderr } = capture.get();
    assert.equal(code, 1);
    assert.equal(stderr, '');
    const errorPayload = parseJsonError(stdout);
    assert.equal(errorPayload.error.code, 'E_INTERNAL');
    assert.equal(errorPayload.error.message, 'forced internal');
  });

  it('diff usage error without --json routes to stderr with exit 2 and deterministic bytes', async () => {
    const firstCapture = createIoCapture();
    const secondCapture = createIoCapture();

    const firstCode = await runCli(
      [
        'diff',
        '--from',
        'missing.ts',
        '--rules',
        'import_files_list',
        '--language',
        'typescript',
      ],
      firstCapture.io,
    );
    const secondCode = await runCli(
      [
        'diff',
        '--from',
        'missing.ts',
        '--rules',
        'import_files_list',
        '--language',
        'typescript',
      ],
      secondCapture.io,
    );

    const first = firstCapture.get();
    const second = secondCapture.get();

    assert.equal(firstCode, 2);
    assert.equal(secondCode, 2);
    assert.equal(first.stdout, '');
    assert.equal(second.stdout, '');
    assert.equal(first.stderr, 'file_read_error: cannot read "missing.ts"\n');
    assert.equal(first.stderr, second.stderr);
  });

  it('diff usage error with --json routes to stdout envelope with exit 2 and deterministic bytes', async () => {
    const firstCapture = createIoCapture();
    const secondCapture = createIoCapture();

    const firstCode = await runCli(
      [
        'diff',
        '--from',
        'missing.ts',
        '--rules',
        'import_files_list',
        '--language',
        'typescript',
        '--json',
      ],
      firstCapture.io,
    );
    const secondCode = await runCli(
      [
        'diff',
        '--from',
        'missing.ts',
        '--rules',
        'import_files_list',
        '--language',
        'typescript',
        '--json',
      ],
      secondCapture.io,
    );

    const first = firstCapture.get();
    const second = secondCapture.get();

    assert.equal(firstCode, 2);
    assert.equal(secondCode, 2);
    assert.equal(first.stderr, '');
    assert.equal(second.stderr, '');
    assert.equal(first.stdout, second.stdout);
    parseJsonError(first.stdout);
  });

  it('diff internal error with --json exits 1 and routes envelope to stdout only', async () => {
    const capture = createIoCapture();

    const code = await runCli(
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
      capture.io,
      {
        runAnalyse: async () => {
          throw new InternalError('forced internal');
        },
        runRulesList,
        resolveRules,
        resolveSource,
        resolveDiffSource: async () => ({
          fromFilename: 'a.ts',
          fromSource: 'export const a = 1;\n',
          toSource: 'export const a = 2;\n',
          language: 'typescript',
        }),
      },
    );

    const { stdout, stderr } = capture.get();
    assert.equal(code, 1);
    assert.equal(stderr, '');
    const errorPayload = parseJsonError(stdout);
    assert.equal(errorPayload.error.code, 'E_INTERNAL');
    assert.equal(errorPayload.error.message, 'forced internal');
  });

  it('rules usage error without --json routes to stderr with exit 2 and deterministic bytes', async () => {
    const firstCapture = createIoCapture();
    const secondCapture = createIoCapture();

    const firstCode = await runCli(
      ['rules', '--language', 'invalid'],
      firstCapture.io,
    );
    const secondCode = await runCli(
      ['rules', '--language', 'invalid'],
      secondCapture.io,
    );

    const first = firstCapture.get();
    const second = secondCapture.get();

    assert.equal(firstCode, 2);
    assert.equal(secondCode, 2);
    assert.equal(first.stdout, '');
    assert.equal(second.stdout, '');
    assert.equal(
      first.stderr,
      "error: option '--language <go|typescript|dart>' argument 'invalid' is invalid. language must be one of: go, typescript, dart\n",
    );
    assert.equal(first.stderr, second.stderr);
  });

  it('rules usage error with --json routes to stdout envelope with exit 2 and deterministic bytes', async () => {
    const firstCapture = createIoCapture();
    const secondCapture = createIoCapture();

    const firstCode = await runCli(
      ['rules', '--language', 'invalid', '--json'],
      firstCapture.io,
    );
    const secondCode = await runCli(
      ['rules', '--language', 'invalid', '--json'],
      secondCapture.io,
    );

    const first = firstCapture.get();
    const second = secondCapture.get();

    assert.equal(firstCode, 2);
    assert.equal(secondCode, 2);
    assert.equal(first.stderr, '');
    assert.equal(second.stderr, '');
    assert.equal(first.stdout, second.stdout);
    parseJsonError(first.stdout);
  });

  it('rules internal error with --json exits 1 and routes envelope to stdout only', async () => {
    const capture = createIoCapture();

    const code = await runCli(
      ['rules', '--language', 'typescript', '--json'],
      capture.io,
      {
        runAnalyse,
        runRulesList: async () => {
          throw new InternalError('forced internal');
        },
        resolveRules,
        resolveSource,
        resolveDiffSource,
      },
    );

    const { stdout, stderr } = capture.get();
    assert.equal(code, 1);
    assert.equal(stderr, '');
    const errorPayload = parseJsonError(stdout);
    assert.equal(errorPayload.error.code, 'E_INTERNAL');
    assert.equal(errorPayload.error.message, 'forced internal');
  });
});
