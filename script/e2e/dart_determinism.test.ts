import { expect, test } from 'bun:test';
import {
  equalBytes,
  expectSuccess,
  parseAnalyseOutput,
  parseDiffOutput,
  runCli,
  runTwice,
} from './helpers.js';

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

test('dart analyse is byte-identical across repeated runs', () => {
  const { first, second } = runTwice(DART_ANALYSE_ARGS);

  expectSuccess(first);
  expectSuccess(second);
  parseAnalyseOutput(first.stdout);
  parseAnalyseOutput(second.stdout);
  expect(equalBytes(first.stdout, second.stdout)).toBeTrue();
});

test('dart diff is byte-identical across repeated runs', () => {
  const { first, second } = runTwice(DART_DIFF_ARGS);

  expectSuccess(first);
  expectSuccess(second);
  parseDiffOutput(first.stdout);
  parseDiffOutput(second.stdout);
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
  parseAnalyseOutput(first.stdout);
  parseAnalyseOutput(second.stdout);
  expect(equalBytes(first.stdout, second.stdout)).toBeTrue();
});

test('dart diff delta-only is deterministic and preserves deltaOnly flag', () => {
  const { first, second } = runTwice([...DART_DIFF_ARGS, '--delta-only']);

  expectSuccess(first);
  expectSuccess(second);
  const firstParsed = parseDiffOutput(first.stdout);
  const secondParsed = parseDiffOutput(second.stdout);

  expect(equalBytes(first.stdout, second.stdout)).toBeTrue();
  expect(firstParsed.deltaOnly).toBeTrue();
  expect(secondParsed.deltaOnly).toBeTrue();
});
