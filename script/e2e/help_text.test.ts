import { expect, test } from 'bun:test';
import { asUtf8, equalBytes, expectSuccess, runTwice } from './helpers.js';

test('maat root help is deterministic', () => {
  const { first, second } = runTwice(['--help']);

  const firstStdout = expectSuccess(first);
  const secondStdout = expectSuccess(second);
  const output = asUtf8(firstStdout);

  expect(equalBytes(firstStdout, secondStdout)).toBeTrue();
  expect(output.length).toBeGreaterThan(0);
  expect(output).toContain('Usage: maat');
  expect(output).toContain('analyse');
  expect(output).toContain('diff');
  expect(output).toContain('rules');
});

test('maat analyse help is deterministic', () => {
  const { first, second } = runTwice(['analyse', '--help']);

  const firstStdout = expectSuccess(first);
  const secondStdout = expectSuccess(second);
  const output = asUtf8(firstStdout);

  expect(equalBytes(firstStdout, secondStdout)).toBeTrue();
  expect(output.length).toBeGreaterThan(0);
  expect(output).toContain('Analyse one source snapshot');
  expect(output).toContain('Required. Comma-separated rule identifiers');
  expect(output).toContain('If omitted,');
  expect(output).toContain('source from stdin');
  expect(output).toContain('Optional. Emit canonical JSON output');
  expect(output).toContain('typescript|go|dart');
});

test('maat diff help is deterministic', () => {
  const { first, second } = runTwice(['diff', '--help']);

  const firstStdout = expectSuccess(first);
  const secondStdout = expectSuccess(second);
  const output = asUtf8(firstStdout);

  expect(equalBytes(firstStdout, secondStdout)).toBeTrue();
  expect(output.length).toBeGreaterThan(0);
  expect(output).toContain('Diff two source snapshots');
  expect(output).toContain('If omitted,');
  expect(output).toContain('read target source from stdin');
  expect(output).toContain('Optional. Emit canonical JSON output');
  expect(output).toContain('Requires --json');
  expect(output).toContain('Exit 3 when the computed diff');
  expect(output).toContain('contains effective changes');
  expect(output).toContain('typescript|go|dart');
});

test('maat rules help is deterministic', () => {
  const { first, second } = runTwice(['rules', '--help']);

  const firstStdout = expectSuccess(first);
  const secondStdout = expectSuccess(second);
  const output = asUtf8(firstStdout);

  expect(equalBytes(firstStdout, secondStdout)).toBeTrue();
  expect(output.length).toBeGreaterThan(0);
  expect(output).toContain('List available rules for one supported language');
  expect(output).toContain('Optional. Emit canonical JSON output');
  expect(output).toContain('typescript|go|dart');
});
