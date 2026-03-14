import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import {
  AnalyseOutputSchema,
  DiffOutputSchema,
} from '../../src/core/contracts/schemas.js';
import { canonicalStringify } from '../../src/core/format/canonical-json.js';
import { asUtf8, equalBytes, runTwice } from './helpers.js';

const expectSuccess = (
  result: ReturnType<typeof runTwice>['first'],
): Buffer => {
  expect(result.exitCode).toBe(0);
  expect(result.stderr.length).toBe(0);
  expect(result.stdout.length).toBeGreaterThan(0);
  return result.stdout;
};

const expectAnalyseSchema = (stdout: Buffer) => {
  const parsed = AnalyseOutputSchema.safeParse(JSON.parse(asUtf8(stdout)));
  expect(parsed.success).toBeTrue();
  if (!parsed.success) {
    throw new Error('AnalyseOutputSchema parse failed');
  }
};

const expectDiffSchema = (stdout: Buffer) => {
  const parsed = DiffOutputSchema.safeParse(JSON.parse(asUtf8(stdout)));
  expect(parsed.success).toBeTrue();
  if (!parsed.success) {
    throw new Error('DiffOutputSchema parse failed');
  }
};

const expectGolden = (stdout: Buffer, goldenPath: string) => {
  const golden = readFileSync(goldenPath, 'utf8');
  const expected = Buffer.from(
    `${canonicalStringify(JSON.parse(golden) as unknown)}\n`,
    'utf8',
  );
  expect(equalBytes(stdout, expected)).toBeTrue();
};

test('typescript analyse output remains byte-identical to the approved golden', () => {
  const args = [
    'analyse',
    '--in',
    'testdata/symbols/analyse.ts',
    '--rules',
    'function_map,method_map,class_map,interface_map,interfaces_code_map',
    '--language',
    'typescript',
    '--json',
  ];

  const { first, second } = runTwice(args);
  const firstStdout = expectSuccess(first);
  const secondStdout = expectSuccess(second);

  expectAnalyseSchema(firstStdout);
  expectAnalyseSchema(secondStdout);
  expect(equalBytes(firstStdout, secondStdout)).toBeTrue();
  expectGolden(firstStdout, 'testdata/symbols/analyse.golden.json');
});

test('typescript diff output remains byte-identical to the approved golden', () => {
  const args = [
    'diff',
    '--from',
    'testdata/metrics/v1.ts',
    '--to',
    'testdata/metrics/v2.ts',
    '--rules',
    'file_metrics',
    '--language',
    'typescript',
    '--json',
  ];

  const { first, second } = runTwice(args);
  const firstStdout = expectSuccess(first);
  const secondStdout = expectSuccess(second);

  expectDiffSchema(firstStdout);
  expectDiffSchema(secondStdout);
  expect(equalBytes(firstStdout, secondStdout)).toBeTrue();
  expectGolden(firstStdout, 'testdata/metrics/diff-file-metrics.golden.json');
});
