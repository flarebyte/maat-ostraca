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
  expect(output).toContain('Rules:');
  expect(output).toContain('- code_hash:');
});

test('maat analyse human output is deterministic', () => {
  const args = [
    'analyse',
    '--in',
    'testdata/go/imports/analyse.go',
    '--rules',
    'import_files_list,file_metrics',
    '--language',
    'go',
  ];
  const { first, second } = runTwice(args);

  const firstStdout = expectSuccess(first);
  const secondStdout = expectSuccess(second);
  const output = asUtf8(firstStdout);

  expect(equalBytes(firstStdout, secondStdout)).toBeTrue();
  expect(output.length).toBeGreaterThan(0);
  expect(output).toContain('File: testdata/go/imports/analyse.go');
  expect(output).toContain('Language: go');
  expect(output).toContain('[file_metrics]');
  expect(output).toContain('[import_files_list]');
});

test('maat diff human output is deterministic', () => {
  const args = [
    'diff',
    '--from',
    'testdata/dart/metrics/v1.dart',
    '--to',
    'testdata/dart/metrics/v2.dart',
    '--rules',
    'file_metrics',
    '--language',
    'dart',
  ];
  const { first, second } = runTwice(args);

  const firstStdout = expectSuccess(first);
  const secondStdout = expectSuccess(second);
  const output = asUtf8(firstStdout);

  expect(equalBytes(firstStdout, secondStdout)).toBeTrue();
  expect(output.length).toBeGreaterThan(0);
  expect(output).toContain('From: testdata/dart/metrics/v1.dart');
  expect(output).toContain('To: testdata/dart/metrics/v2.dart');
  expect(output).toContain('[file_metrics]');
  expect(output).toContain('loc:');
});
