import { expect, test } from 'bun:test';
import {
  equalBytes,
  expectSuccess,
  parseAnalyseOutput,
  runCli,
  runTwice,
} from './helpers.js';

const TYPESCRIPT_RULES = [
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

const GO_RULES = [
  'import_files_list',
  'package_imports_list',
  'exception_messages_list',
  'error_messages_list',
  'env_names_list',
  'testcase_titles_list',
  'function_map',
  'method_map',
  'interface_map',
  'interfaces_code_map',
  'file_metrics',
  'code_hash',
  'io_calls_count',
  'io_read_calls_count',
  'io_write_calls_count',
].join(',');

const DART_RULES = [
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

const cases = [
  {
    language: 'typescript',
    file: 'testdata/determinism/wide-v1.ts',
    rules: TYPESCRIPT_RULES,
  },
  {
    language: 'go',
    file: 'testdata/go/determinism/wide-v1.go',
    rules: GO_RULES,
  },
  {
    language: 'dart',
    file: 'testdata/dart/determinism/wide-v1.dart',
    rules: DART_RULES,
  },
];
for (const { language, file, rules } of cases) {
  const args = (selector: string) => [
    'analyse',
    '--in',
    file,
    '--rules',
    selector,
    '--language',
    language,
    '--json',
  ];
  const assertEqualOutputs = (
    first: ReturnType<typeof runCli>,
    second: ReturnType<typeof runCli>,
  ) => {
    const left = expectSuccess(first);
    const right = expectSuccess(second);
    parseAnalyseOutput(left);
    parseAnalyseOutput(right);
    expect(equalBytes(left, right)).toBeTrue();
  };
  test(`maat analyse with --rules * is deterministic for ${language} json output`, () => {
    const { first, second } = runTwice(args('*'));
    assertEqualOutputs(first, second);
  });
  test(`maat analyse with --rules * matches the fully expanded ${language} rule list`, () => {
    assertEqualOutputs(runCli(args('*')), runCli(args(rules)));
  });
}
