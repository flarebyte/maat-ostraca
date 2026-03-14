import { expect, test } from 'bun:test';
import { asUtf8, equalBytes, expectSuccess, runTwice } from './helpers.js';

test('maat rules human output is deterministic', () => {
  const args = ['rules', '--language', 'typescript'];
  const { first, second } = runTwice(args);

  const firstStdout = expectSuccess(first);
  const secondStdout = expectSuccess(second);
  const output = asUtf8(firstStdout);

  expect(equalBytes(firstStdout, secondStdout)).toBeTrue();
  expect(output.length).toBeGreaterThan(0);
  expect(output).toContain('Language: typescript');
  expect(output).toContain('Imports');
  expect(output).toContain('Symbols');
  expect(output).toContain('Metrics');
});

test('maat rules human output is deterministic for go', () => {
  const args = ['rules', '--language', 'go'];
  const { first, second } = runTwice(args);

  const firstStdout = expectSuccess(first);
  const secondStdout = expectSuccess(second);
  const output = asUtf8(firstStdout);

  expect(equalBytes(firstStdout, secondStdout)).toBeTrue();
  expect(output.length).toBeGreaterThan(0);
  expect(output).toContain('Language: go');
  expect(output).toContain('Imports');
  expect(output).toContain('Messages');
  expect(output).toContain('Tests');
});

test('maat rules human output is deterministic for dart', () => {
  const args = ['rules', '--language', 'dart'];
  const { first, second } = runTwice(args);

  const firstStdout = expectSuccess(first);
  const secondStdout = expectSuccess(second);
  const output = asUtf8(firstStdout);

  expect(equalBytes(firstStdout, secondStdout)).toBeTrue();
  expect(output.length).toBeGreaterThan(0);
  expect(output).toContain('Language: dart');
  expect(output).toContain('Imports');
  expect(output).toContain('Symbols');
  expect(output).toContain('Environment');
});

test('maat analyse human output is deterministic', () => {
  const args = [
    'analyse',
    '--in',
    'testdata/go/human_summary/analyse.go',
    '--rules',
    'function_map,import_files_list',
    '--language',
    'go',
  ];
  const { first, second } = runTwice(args);

  const firstStdout = expectSuccess(first);
  const secondStdout = expectSuccess(second);
  const output = asUtf8(firstStdout);

  expect(equalBytes(firstStdout, secondStdout)).toBeTrue();
  expect(output.length).toBeGreaterThan(0);
  expect(output).toContain('File: testdata/go/human_summary/analyse.go');
  expect(output).toContain('Language: go');
  expect(output).toContain('[function_map]');
  expect(output).toContain('[import_files_list]');
  expect(output).toContain('Count: 12 entries total');
  expect(output).toContain('Count: 12 items total');
  expect(output).toContain('... and 2 more');
});

test('maat diff human output is deterministic', () => {
  const args = [
    'diff',
    '--from',
    'testdata/dart/human_summary/v1.dart',
    '--to',
    'testdata/dart/human_summary/v2.dart',
    '--rules',
    'function_map,file_metrics',
    '--language',
    'dart',
  ];
  const { first, second } = runTwice(args);

  const firstStdout = expectSuccess(first);
  const secondStdout = expectSuccess(second);
  const output = asUtf8(firstStdout);

  expect(equalBytes(firstStdout, secondStdout)).toBeTrue();
  expect(output.length).toBeGreaterThan(0);
  expect(output).toContain('From: testdata/dart/human_summary/v1.dart');
  expect(output).toContain('To: testdata/dart/human_summary/v2.dart');
  expect(output).toContain('Summary');
  expect(output).toContain('[function_map]');
  expect(output).toContain('[file_metrics]');
  expect(output).toContain('file_metrics:');
  expect(output).toContain('Count: 12 entries total');
  expect(output).toContain('... and 2 more');
});

test('maat diff human summary is deterministic for typescript metrics and hash', () => {
  const args = [
    'diff',
    '--from',
    'testdata/metrics/v1.ts',
    '--to',
    'testdata/metrics/v2.ts',
    '--rules',
    'file_metrics,code_hash',
    '--language',
    'typescript',
  ];
  const { first, second } = runTwice(args);

  const firstStdout = expectSuccess(first);
  const secondStdout = expectSuccess(second);
  const output = asUtf8(firstStdout);

  expect(equalBytes(firstStdout, secondStdout)).toBeTrue();
  expect(output.length).toBeGreaterThan(0);
  expect(output).toContain('Summary');
  expect(output).toContain('code_hash: changed');
  expect(output).toContain('file_metrics:');
  expect(output.indexOf('Summary')).toBeLessThan(output.indexOf('[code_hash]'));
});

test('maat diff human summary is deterministic for go function maps', () => {
  const args = [
    'diff',
    '--from',
    'testdata/go/symbols_metrics/v1.go',
    '--to',
    'testdata/go/symbols_metrics/v2.go',
    '--rules',
    'function_map',
    '--language',
    'go',
  ];
  const { first, second } = runTwice(args);

  const firstStdout = expectSuccess(first);
  const secondStdout = expectSuccess(second);
  const output = asUtf8(firstStdout);

  expect(equalBytes(firstStdout, secondStdout)).toBeTrue();
  expect(output.length).toBeGreaterThan(0);
  expect(output).toContain('Summary');
  expect(output).toContain('function_map:');
  expect(output.indexOf('Summary')).toBeLessThan(
    output.indexOf('[function_map]'),
  );
});
