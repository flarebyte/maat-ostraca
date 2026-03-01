import { expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { JsonErrorOutputSchema } from '../../src/core/contracts/schemas.js';

const runCli = (args: string[]) =>
  spawnSync('node', ['--import', 'tsx', 'src/cmd/maat/index.ts', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

const assertJsonError = (stdout: string) => {
  const payload = JSON.parse(stdout) as unknown;
  const parsed = JsonErrorOutputSchema.safeParse(payload);
  expect(parsed.success).toBeTrue();
  if (!parsed.success) {
    throw new Error('JsonErrorOutputSchema parse failed');
  }
  return parsed.data;
};

const runTwiceUsageJsonCase = (args: string[], expectedCode: string): void => {
  const first = runCli(args);
  const second = runCli(args);

  expect(first.status).toBe(2);
  expect(second.status).toBe(2);
  expect(first.stderr).toBe('');
  expect(second.stderr).toBe('');
  expect(first.stdout).toBe(second.stdout);

  const payload = assertJsonError(first.stdout);
  expect(payload.error.code).toBe(expectedCode);
};

test('analyse unknown rule with --json returns usage envelope on stdout only', () => {
  runTwiceUsageJsonCase(
    [
      'analyse',
      '--language',
      'typescript',
      '--rules',
      'does_not_exist',
      '--json',
    ],
    'E_USAGE',
  );
});

test('diff missing --from file with --json returns usage envelope on stdout only', () => {
  runTwiceUsageJsonCase(
    [
      'diff',
      '--from',
      'missing-does-not-exist.ts',
      '--language',
      'typescript',
      '--rules',
      'import_files_list',
      '--json',
    ],
    'E_IO',
  );
});

test('rules invalid language with --json returns usage envelope on stdout only', () => {
  runTwiceUsageJsonCase(
    ['rules', '--language', 'invalid', '--json'],
    'E_USAGE',
  );
});
