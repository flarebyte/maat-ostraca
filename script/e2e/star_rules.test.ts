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

test('maat analyse with --rules * is deterministic for typescript json output', () => {
  const args = [
    'analyse',
    '--in',
    'testdata/determinism/wide-v1.ts',
    '--rules',
    '*',
    '--language',
    'typescript',
    '--json',
  ];
  const { first, second } = runTwice(args);

  const firstStdout = expectSuccess(first);
  const secondStdout = expectSuccess(second);

  parseAnalyseOutput(firstStdout);
  parseAnalyseOutput(secondStdout);
  expect(equalBytes(firstStdout, secondStdout)).toBeTrue();
});

test('maat analyse with --rules * is deterministic for go json output', () => {
  const args = [
    'analyse',
    '--in',
    'testdata/go/determinism/wide-v1.go',
    '--rules',
    '*',
    '--language',
    'go',
    '--json',
  ];
  const { first, second } = runTwice(args);

  const firstStdout = expectSuccess(first);
  const secondStdout = expectSuccess(second);

  parseAnalyseOutput(firstStdout);
  parseAnalyseOutput(secondStdout);
  expect(equalBytes(firstStdout, secondStdout)).toBeTrue();
});

test('maat analyse with --rules * is deterministic for dart json output', () => {
  const args = [
    'analyse',
    '--in',
    'testdata/dart/determinism/wide-v1.dart',
    '--rules',
    '*',
    '--language',
    'dart',
    '--json',
  ];
  const { first, second } = runTwice(args);

  const firstStdout = expectSuccess(first);
  const secondStdout = expectSuccess(second);

  parseAnalyseOutput(firstStdout);
  parseAnalyseOutput(secondStdout);
  expect(equalBytes(firstStdout, secondStdout)).toBeTrue();
});

test('maat analyse with --rules * matches the fully expanded typescript rule list', () => {
  const wildcard = runCli([
    'analyse',
    '--in',
    'testdata/determinism/wide-v1.ts',
    '--rules',
    '*',
    '--language',
    'typescript',
    '--json',
  ]);
  const expanded = runCli([
    'analyse',
    '--in',
    'testdata/determinism/wide-v1.ts',
    '--rules',
    TYPESCRIPT_RULES,
    '--language',
    'typescript',
    '--json',
  ]);

  const wildcardStdout = expectSuccess(wildcard);
  const expandedStdout = expectSuccess(expanded);

  parseAnalyseOutput(wildcardStdout);
  parseAnalyseOutput(expandedStdout);
  expect(equalBytes(wildcardStdout, expandedStdout)).toBeTrue();
});

test('maat analyse with --rules * matches the fully expanded go rule list', () => {
  const wildcard = runCli([
    'analyse',
    '--in',
    'testdata/go/determinism/wide-v1.go',
    '--rules',
    '*',
    '--language',
    'go',
    '--json',
  ]);
  const expanded = runCli([
    'analyse',
    '--in',
    'testdata/go/determinism/wide-v1.go',
    '--rules',
    GO_RULES,
    '--language',
    'go',
    '--json',
  ]);

  const wildcardStdout = expectSuccess(wildcard);
  const expandedStdout = expectSuccess(expanded);

  parseAnalyseOutput(wildcardStdout);
  parseAnalyseOutput(expandedStdout);
  expect(equalBytes(wildcardStdout, expandedStdout)).toBeTrue();
});

test('maat analyse with --rules * matches the fully expanded dart rule list', () => {
  const wildcard = runCli([
    'analyse',
    '--in',
    'testdata/dart/determinism/wide-v1.dart',
    '--rules',
    '*',
    '--language',
    'dart',
    '--json',
  ]);
  const expanded = runCli([
    'analyse',
    '--in',
    'testdata/dart/determinism/wide-v1.dart',
    '--rules',
    DART_RULES,
    '--language',
    'dart',
    '--json',
  ]);

  const wildcardStdout = expectSuccess(wildcard);
  const expandedStdout = expectSuccess(expanded);

  parseAnalyseOutput(wildcardStdout);
  parseAnalyseOutput(expandedStdout);
  expect(equalBytes(wildcardStdout, expandedStdout)).toBeTrue();
});
