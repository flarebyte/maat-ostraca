import { expect, test } from 'bun:test';
import {
  equalBytes,
  expectSuccess,
  parseAnalyseOutput,
  parseDiffOutput,
  runCli,
  runTwice,
} from './helpers.js';

const GO_WIDE_RULES = [
  'import_files_list',
  'package_imports_list',
  'file_metrics',
  'code_hash',
  'function_map',
  'method_map',
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

const GO_WIDE_RULES_ORDER_A = [
  'testcase_titles_list',
  'env_names_list',
  'exception_messages_list',
  'error_messages_list',
  'io_write_calls_count',
  'io_read_calls_count',
  'io_calls_count',
  'interfaces_code_map',
  'interface_map',
  'method_map',
  'function_map',
  'code_hash',
  'file_metrics',
  'package_imports_list',
  'import_files_list',
].join(',');

const GO_WIDE_RULES_ORDER_B = [
  'import_files_list',
  'package_imports_list',
  'file_metrics',
  'code_hash',
  'function_map',
  'method_map',
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

const GO_ANALYSE_ARGS = [
  'analyse',
  '--in',
  'testdata/go/determinism/wide-v1.go',
  '--rules',
  GO_WIDE_RULES,
  '--language',
  'go',
  '--json',
];

const GO_DIFF_ARGS = [
  'diff',
  '--from',
  'testdata/go/determinism/wide-v1.go',
  '--to',
  'testdata/go/determinism/wide-v2.go',
  '--rules',
  GO_WIDE_RULES,
  '--language',
  'go',
  '--json',
];

test('go analyse is byte-identical across repeated runs', () => {
  const { first, second } = runTwice(GO_ANALYSE_ARGS);

  expectSuccess(first);
  expectSuccess(second);
  parseAnalyseOutput(first.stdout);
  parseAnalyseOutput(second.stdout);
  expect(equalBytes(first.stdout, second.stdout)).toBeTrue();
});

test('go diff is byte-identical across repeated runs', () => {
  const { first, second } = runTwice(GO_DIFF_ARGS);

  expectSuccess(first);
  expectSuccess(second);
  parseDiffOutput(first.stdout);
  parseDiffOutput(second.stdout);
  expect(equalBytes(first.stdout, second.stdout)).toBeTrue();
});

test('go analyse output is invariant to explicit rule ordering', () => {
  const first = runCli([
    'analyse',
    '--in',
    'testdata/go/determinism/wide-v1.go',
    '--rules',
    GO_WIDE_RULES_ORDER_A,
    '--language',
    'go',
    '--json',
  ]);
  const second = runCli([
    'analyse',
    '--in',
    'testdata/go/determinism/wide-v1.go',
    '--rules',
    GO_WIDE_RULES_ORDER_B,
    '--language',
    'go',
    '--json',
  ]);

  expectSuccess(first);
  expectSuccess(second);
  parseAnalyseOutput(first.stdout);
  parseAnalyseOutput(second.stdout);
  expect(equalBytes(first.stdout, second.stdout)).toBeTrue();
});

test('go diff delta-only is deterministic and preserves deltaOnly flag', () => {
  const { first, second } = runTwice([...GO_DIFF_ARGS, '--delta-only']);

  expectSuccess(first);
  expectSuccess(second);
  const firstParsed = parseDiffOutput(first.stdout);
  const secondParsed = parseDiffOutput(second.stdout);

  expect(equalBytes(first.stdout, second.stdout)).toBeTrue();
  expect(firstParsed.deltaOnly).toBeTrue();
  expect(secondParsed.deltaOnly).toBeTrue();
});
