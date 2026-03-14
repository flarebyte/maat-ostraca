import { expect, test } from 'bun:test';
import { equalBytes, parseDiffOutput, runCli, runTwice } from './helpers.js';

test('typescript identical diff with --exit-code-on-change exits 0 and keeps json stdout unchanged', () => {
  const input = Buffer.from('export const value = 1;\n', 'utf8');
  const baseArgs = [
    'diff',
    '--from',
    'testdata/diff-from.ts',
    '--rules',
    'import_files_list,file_metrics,code_hash',
    '--language',
    'typescript',
    '--json',
  ];

  const withoutFlag = runCli(baseArgs, input);
  const withFlag = runCli([...baseArgs, '--exit-code-on-change'], input);
  const repeated = runTwice([...baseArgs, '--exit-code-on-change'], input);

  expect(withoutFlag.exitCode).toBe(0);
  expect(withFlag.exitCode).toBe(0);
  expect(equalBytes(withFlag.stdout, withoutFlag.stdout)).toBeTrue();
  expect(equalBytes(repeated.first.stdout, repeated.second.stdout)).toBeTrue();
  parseDiffOutput(withFlag.stdout);
  parseDiffOutput(repeated.first.stdout);
});

test('go changed diff with --exit-code-on-change exits 3 and keeps json stdout unchanged', () => {
  const baseArgs = [
    'diff',
    '--from',
    'testdata/go/hash/v1.go',
    '--to',
    'testdata/go/hash/v2.go',
    '--rules',
    'code_hash',
    '--language',
    'go',
    '--json',
  ];

  const withoutFlag = runCli(baseArgs);
  const withFlag = runCli([...baseArgs, '--exit-code-on-change']);
  const repeated = runTwice([...baseArgs, '--exit-code-on-change']);

  expect(withoutFlag.exitCode).toBe(0);
  expect(withFlag.exitCode).toBe(3);
  expect(equalBytes(withFlag.stdout, withoutFlag.stdout)).toBeTrue();
  expect(equalBytes(repeated.first.stdout, repeated.second.stdout)).toBeTrue();
  parseDiffOutput(withFlag.stdout);
  parseDiffOutput(repeated.first.stdout);
});

test('dart changed delta-only diff with --exit-code-on-change exits 3 and keeps json stdout unchanged', () => {
  const baseArgs = [
    'diff',
    '--from',
    'testdata/dart/metrics/v1.dart',
    '--to',
    'testdata/dart/metrics/v2.dart',
    '--rules',
    'file_metrics',
    '--language',
    'dart',
    '--json',
    '--delta-only',
  ];

  const withoutFlag = runCli(baseArgs);
  const withFlag = runCli([...baseArgs, '--exit-code-on-change']);
  const repeated = runTwice([...baseArgs, '--exit-code-on-change']);

  expect(withoutFlag.exitCode).toBe(0);
  expect(withFlag.exitCode).toBe(3);
  expect(equalBytes(withFlag.stdout, withoutFlag.stdout)).toBeTrue();
  expect(equalBytes(repeated.first.stdout, repeated.second.stdout)).toBeTrue();

  const parsed = parseDiffOutput(withFlag.stdout);
  expect(parsed.deltaOnly).toBeTrue();
  parseDiffOutput(repeated.first.stdout);
});
