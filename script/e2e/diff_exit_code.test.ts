import { expect, test } from 'bun:test';
import { goHashDiffArgs } from '../../test/cli-fixture-args.js';
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

  expectFlagOutput(baseArgs, 0, input, false);
});

test('go changed diff with --exit-code-on-change exits 3 and keeps json stdout unchanged', () => {
  const baseArgs = goHashDiffArgs();

  expectFlagOutput(baseArgs, 3, undefined, false);
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

  expectFlagOutput(baseArgs, 3, undefined, true);
});

const expectFlagOutput = (
  args: string[],
  status: number,
  input?: Buffer,
  deltaOnly = false,
) => {
  const baseline = runCli(args, input);
  const flagged = [...args, '--exit-code-on-change'];
  const result = runCli(flagged, input);
  const repeated = runTwice(flagged, input);
  expect(baseline.exitCode).toBe(0);
  expect(result.exitCode).toBe(status);
  expect(equalBytes(result.stdout, baseline.stdout)).toBeTrue();
  expect(equalBytes(repeated.first.stdout, repeated.second.stdout)).toBeTrue();
  const parsed = parseDiffOutput(result.stdout);
  if (deltaOnly) expect(parsed.deltaOnly).toBeTrue();
  parseDiffOutput(repeated.first.stdout);
};
