import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import {
  AnalyseOutputSchema,
  DiffOutputSchema,
} from '../../src/core/contracts/schemas.js';
import { canonicalStringify } from '../../src/core/format/canonical-json.js';
import { asUtf8, equalBytes, runCli, runTwice } from './helpers.js';

const WIDE_RULES = [
  'import_files_list',
  'package_imports_list',
  'exception_messages_list',
  'error_messages_list',
  'env_names_list',
  'testcase_titles_list',
  'function_map',
  'method_map',
  'class_map',
  'interface_map',
  'interfaces_code_map',
  'file_metrics',
  'code_hash',
  'io_calls_count',
  'io_read_calls_count',
  'io_write_calls_count',
].join(',');

const WIDE_RULES_ORDER_A = [
  'io_*',
  'import_files_list',
  'package_imports_list',
  'exception_messages_list',
  'error_messages_list',
  'env_names_list',
  'testcase_titles_list',
  'function_map',
  'method_map',
  'class_map',
  'interface_map',
  'interfaces_code_map',
  'file_metrics',
  'code_hash',
].join(',');

const WIDE_RULES_ORDER_B = [
  'code_hash',
  'file_metrics',
  'interfaces_code_map',
  'interface_map',
  'class_map',
  'method_map',
  'function_map',
  'testcase_titles_list',
  'env_names_list',
  'error_messages_list',
  'exception_messages_list',
  'package_imports_list',
  'import_files_list',
  'io_*',
].join(',');

const ANALYSE_ARGS = [
  'analyse',
  '--in',
  'testdata/determinism/wide-v1.ts',
  '--rules',
  WIDE_RULES,
  '--language',
  'typescript',
  '--json',
];

const DIFF_ARGS = [
  'diff',
  '--from',
  'testdata/determinism/wide-v1.ts',
  '--to',
  'testdata/determinism/wide-v2.ts',
  '--rules',
  WIDE_RULES,
  '--language',
  'typescript',
  '--json',
];

const DIFF_DELTA_ONLY_ARGS = [...DIFF_ARGS, '--delta-only'];

const expectSuccess = (result: ReturnType<typeof runCli>) => {
  expect(result.exitCode).toBe(0);
  expect(result.stderr.length).toBe(0);
  expect(result.stdout.length).toBeGreaterThan(0);
};

const parseAnalyse = (stdout: Buffer) => {
  const payload = JSON.parse(asUtf8(stdout)) as unknown;
  const parsed = AnalyseOutputSchema.safeParse(payload);
  expect(parsed.success).toBeTrue();
  if (!parsed.success) {
    throw new Error('AnalyseOutputSchema parse failed');
  }
  return parsed.data;
};

const parseDiff = (stdout: Buffer) => {
  const payload = JSON.parse(asUtf8(stdout)) as unknown;
  const parsed = DiffOutputSchema.safeParse(payload);
  expect(parsed.success).toBeTrue();
  if (!parsed.success) {
    throw new Error('DiffOutputSchema parse failed');
  }
  return parsed.data;
};

const expectGolden = (stdout: Buffer, goldenPath: string) => {
  const golden = readFileSync(goldenPath);
  const expected = Buffer.from(
    `${canonicalStringify(JSON.parse(asUtf8(golden)) as unknown)}\n`,
    'utf8',
  );
  expect(equalBytes(stdout, expected)).toBeTrue();
};

test('analyse json output is deterministic across repeated runs', () => {
  const { first, second } = runTwice(ANALYSE_ARGS);

  expectSuccess(first);
  expectSuccess(second);
  parseAnalyse(first.stdout);
  parseAnalyse(second.stdout);
  expect(equalBytes(first.stdout, second.stdout)).toBeTrue();
  expectGolden(first.stdout, 'testdata/determinism/wide-analyse.golden.json');
});

test('diff json output is deterministic across repeated runs', () => {
  const { first, second } = runTwice(DIFF_ARGS);

  expectSuccess(first);
  expectSuccess(second);
  parseDiff(first.stdout);
  parseDiff(second.stdout);
  expect(equalBytes(first.stdout, second.stdout)).toBeTrue();
  expectGolden(first.stdout, 'testdata/determinism/wide-diff.golden.json');
});

test('analyse output bytes are invariant to rule order with wildcard + explicit mix', () => {
  const first = runCli([
    'analyse',
    '--in',
    'testdata/determinism/wide-v1.ts',
    '--rules',
    WIDE_RULES_ORDER_A,
    '--language',
    'typescript',
    '--json',
  ]);
  const second = runCli([
    'analyse',
    '--in',
    'testdata/determinism/wide-v1.ts',
    '--rules',
    WIDE_RULES_ORDER_B,
    '--language',
    'typescript',
    '--json',
  ]);

  expectSuccess(first);
  expectSuccess(second);
  parseAnalyse(first.stdout);
  parseAnalyse(second.stdout);
  expect(equalBytes(first.stdout, second.stdout)).toBeTrue();
});

test('diff delta-only output is deterministic and preserves delta-only shape checks', () => {
  const standard = runCli(DIFF_ARGS);
  const { first, second } = runTwice(DIFF_DELTA_ONLY_ARGS);

  expectSuccess(standard);
  expectSuccess(first);
  expectSuccess(second);

  const standardParsed = parseDiff(standard.stdout);
  const firstParsed = parseDiff(first.stdout);
  parseDiff(second.stdout);

  expect(equalBytes(first.stdout, second.stdout)).toBeTrue();
  expectGolden(
    first.stdout,
    'testdata/determinism/wide-diff.delta-only.golden.json',
  );

  expect(standardParsed.deltaOnly).toBeUndefined();
  expect(firstParsed.deltaOnly).toBeTrue();

  const standardMetrics = standardParsed.rules.file_metrics as Record<
    string,
    unknown
  >;
  const deltaOnlyMetrics = firstParsed.rules.file_metrics as Record<
    string,
    unknown
  >;

  expect(typeof standardMetrics.loc).toBe('object');
  expect(typeof deltaOnlyMetrics.loc).toBe('number');

  const standardHash = standardParsed.rules.code_hash as Record<
    string,
    unknown
  >;
  const deltaOnlyHash = firstParsed.rules.code_hash as Record<string, unknown>;

  expect(Object.hasOwn(standardHash, 'from')).toBeTrue();
  expect(Object.hasOwn(standardHash, 'to')).toBeTrue();
  expect(Object.hasOwn(deltaOnlyHash, 'from')).toBeFalse();
  expect(Object.hasOwn(deltaOnlyHash, 'to')).toBeFalse();
  expect(Object.hasOwn(deltaOnlyHash, 'changed')).toBeTrue();
});
