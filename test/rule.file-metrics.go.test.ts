import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import type { AnalyseOutput } from '../src/core/contracts/outputs.js';
import { diffResults } from '../src/core/diff/index.js';
import { run } from '../src/rules/file_metrics/go.js';

const readFixture = (path: string): string => {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
};

const base = (rules: Record<string, unknown>): AnalyseOutput => ({
  filename: 'file.go',
  language: 'go',
  rules,
});

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

  it('diff integration builds numeric deltas for go file_metrics fields', () => {
    const from = base({
      file_metrics: {
        loc: 10,
        sloc: 8,
        tokens: 20,
        loops: 1,
        conditions: 2,
        cyclomaticComplexity: 4,
        cognitiveComplexity: 4,
        maxNestingDepth: 2,
      },
    });
    const to = base({
      file_metrics: {
        loc: 13,
        sloc: 10,
        tokens: 29,
        loops: 3,
        conditions: 4,
        cyclomaticComplexity: 8,
        cognitiveComplexity: 8,
        maxNestingDepth: 3,
      },
    });

    const diff = diffResults(from, to, {});

    assert.deepEqual(diff.rules.file_metrics, {
      cognitiveComplexity: { from: 4, to: 8, delta: 4 },
      conditions: { from: 2, to: 4, delta: 2 },
      cyclomaticComplexity: { from: 4, to: 8, delta: 4 },
      loc: { from: 10, to: 13, delta: 3 },
      loops: { from: 1, to: 3, delta: 2 },
      maxNestingDepth: { from: 2, to: 3, delta: 1 },
      sloc: { from: 8, to: 10, delta: 2 },
      tokens: { from: 20, to: 29, delta: 9 },
    });
  });

  it('diff integration delta-only returns numeric deltas for go file_metrics', () => {
    const from = base({
      file_metrics: {
        loc: 2,
        sloc: 2,
        tokens: 6,
        loops: 0,
        conditions: 1,
        cyclomaticComplexity: 2,
        cognitiveComplexity: 2,
        maxNestingDepth: 1,
      },
    });
    const to = base({
      file_metrics: {
        loc: 5,
        sloc: 4,
        tokens: 11,
        loops: 1,
        conditions: 3,
        cyclomaticComplexity: 5,
        cognitiveComplexity: 5,
        maxNestingDepth: 2,
      },
    });

    const diff = diffResults(from, to, { deltaOnly: true });

    assert.deepEqual(diff.rules.file_metrics, {
      cognitiveComplexity: 3,
      conditions: 2,
      cyclomaticComplexity: 3,
      loc: 3,
      loops: 1,
      maxNestingDepth: 1,
      sloc: 2,
      tokens: 5,
    });
  });
});
