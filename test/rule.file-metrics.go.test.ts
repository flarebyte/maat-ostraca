import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { run } from '../src/rules/file_metrics/go.js';
import { readFixture, registerFileMetricsDiffTests } from './helpers.js';

describe('rule file_metrics/go', () => {
  it('computes loc and sloc deterministically with blank lines', async () => {
    const source = readFixture('../testdata/go/metrics/loc-sloc.go');

    const result = await run({ source, language: 'go' });

    assert.equal(result.loc, 9);
    assert.equal(result.sloc, 4);
  });

  it('counts loops across supported go loop forms', async () => {
    const source = readFixture('../testdata/go/metrics/loops.go');

    const result = await run({ source, language: 'go' });

    assert.equal(result.loops, 4);
  });

  it('counts conditions across if, switch case and select case forms', async () => {
    const source = readFixture('../testdata/go/metrics/conditions.go');

    const result = await run({ source, language: 'go' });

    assert.equal(result.conditions, 6);
  });

  it('computes cyclomatic complexity per the documented rule', async () => {
    const source = [
      'package sample',
      '',
      'func score(x int, items []int) int {',
      '  if x > 0 {',
      '    for _, item := range items {',
      '      if item > 1 {',
      '        return item',
      '      }',
      '    }',
      '  }',
      '  return 0',
      '}',
      '',
    ].join('\n');

    const result = await run({ source, language: 'go' });

    assert.equal(result.loops, 1);
    assert.equal(result.conditions, 2);
    assert.equal(result.cyclomaticComplexity, 4);
    assert.equal(result.cognitiveComplexity, 4);
  });

  it('computes a stable max nesting depth approximation', async () => {
    const source = readFixture('../testdata/go/metrics/nesting.go');

    const result = await run({ source, language: 'go' });

    assert.equal(result.maxNestingDepth, 5);
  });

  it('returns zeros for empty source', async () => {
    const result = await run({ source: '', language: 'go' });

    assert.deepEqual(result, {
      loc: 0,
      sloc: 0,
      cyclomaticComplexity: 0,
      cognitiveComplexity: 0,
      maxNestingDepth: 0,
      tokens: 0,
      loops: 0,
      conditions: 0,
    });
  });

  registerFileMetricsDiffTests('file.go', 'go');
});
