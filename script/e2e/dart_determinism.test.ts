import { expect, test } from 'bun:test';
import {
  AnalyseOutputSchema,
  DiffOutputSchema,
} from '../../src/core/contracts/schemas.js';
import { asUtf8, equalBytes, runCli, runTwice } from './helpers.js';

const DART_WIDE_RULES = [
  'import_files_list',
  'package_imports_list',
  'file_metrics',
  'code_hash',
  'function_map',
  'method_map',
  'class_map',
  'interface_map',
  'interfaces_code_map',
  'io_calls_count',
  'io_read_calls_count',
  'io_write_calls_count',
  'error_messages_list',
  'exception_messages_list',
  'env_names_list',
  'testcase_titles_list',
].join(',');

const DART_WIDE_RULES_ORDER_A = [
  'testcase_titles_list',
  'env_names_list',
  'exception_messages_list',
  'error_messages_list',
  'io_write_calls_count',
  'io_read_calls_count',
  'io_calls_count',
  'interfaces_code_map',
  'interface_map',
  'class_map',
  'method_map',
  'function_map',
  'code_hash',
  'file_metrics',
  'package_imports_list',
  'import_files_list',
].join(',');

const DART_WIDE_RULES_ORDER_B = [
  'import_files_list',
  'package_imports_list',
  'file_metrics',
  'code_hash',
  'function_map',
  'method_map',
  'class_map',
  'interface_map',
  'interfaces_code_map',
  'io_calls_count',
  'io_read_calls_count',
  'io_write_calls_count',
  'error_messages_list',
  'exception_messages_list',
  'env_names_list',
  'testcase_titles_list',
].join(',');

const DART_ANALYSE_ARGS = [
  'analyse',
  '--in',
  'testdata/dart/determinism/wide-v1.dart',
  '--rules',
  DART_WIDE_RULES,
  '--language',
  'dart',
  '--json',
];

const DART_DIFF_ARGS = [
  'diff',
  '--from',
  'testdata/dart/determinism/wide-v1.dart',
  '--to',
  'testdata/dart/determinism/wide-v2.dart',
  '--rules',
  DART_WIDE_RULES,
  '--language',
  'dart',
  '--json',
];

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

test('dart analyse is byte-identical across repeated runs', () => {
  const { first, second } = runTwice(DART_ANALYSE_ARGS);

  expectSuccess(first);
  expectSuccess(second);
  parseAnalyse(first.stdout);
  parseAnalyse(second.stdout);
  expect(equalBytes(first.stdout, second.stdout)).toBeTrue();
});

test('dart diff is byte-identical across repeated runs', () => {
  const { first, second } = runTwice(DART_DIFF_ARGS);

  expectSuccess(first);
  expectSuccess(second);
  parseDiff(first.stdout);
  parseDiff(second.stdout);
  expect(equalBytes(first.stdout, second.stdout)).toBeTrue();
});

test('dart analyse output is invariant to explicit rule ordering', () => {
  const first = runCli([
    'analyse',
    '--in',
    'testdata/dart/determinism/wide-v1.dart',
    '--rules',
    DART_WIDE_RULES_ORDER_A,
    '--language',
    'dart',
    '--json',
  ]);
  const second = runCli([
    'analyse',
    '--in',
    'testdata/dart/determinism/wide-v1.dart',
    '--rules',
    DART_WIDE_RULES_ORDER_B,
    '--language',
    'dart',
    '--json',
  ]);

  expectSuccess(first);
  expectSuccess(second);
  parseAnalyse(first.stdout);
  parseAnalyse(second.stdout);
  expect(equalBytes(first.stdout, second.stdout)).toBeTrue();
});

test('dart diff delta-only is deterministic and preserves deltaOnly flag', () => {
  const { first, second } = runTwice([...DART_DIFF_ARGS, '--delta-only']);

  expectSuccess(first);
  expectSuccess(second);
  const firstParsed = parseDiff(first.stdout);
  const secondParsed = parseDiff(second.stdout);

  expect(equalBytes(first.stdout, second.stdout)).toBeTrue();
  expect(firstParsed.deltaOnly).toBeTrue();
  expect(secondParsed.deltaOnly).toBeTrue();
});
