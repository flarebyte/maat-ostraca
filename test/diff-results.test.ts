import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AnalyseOutput } from '../src/core/contracts/outputs.js';
import { diffResults } from '../src/core/diff/index.js';
import { InternalError } from '../src/core/errors/index.js';

const base = (rules: Record<string, unknown>): AnalyseOutput => ({
  filename: 'file.ts',
  language: 'typescript',
  rules,
});

describe('diffResults', () => {
  it('handles map added/removed/modified/unchanged with sorted keys', () => {
    const from = base({
      function_map: {
        b: { loc: 1, sloc: 1 },
        c: { loc: 2 },
        d: { loc: 3 },
      },
    });
    const to = base({
      function_map: {
        a: { loc: 4 },
        b: { loc: 1, sloc: 1 },
        c: { loc: 5 },
      },
    });

    const diff = diffResults(from, to, { deltaOnly: false });
    const map = diff.rules.function_map as Record<string, unknown>;

    assert.deepEqual(Object.keys(map), ['a', 'b', 'c', 'd']);
    assert.deepEqual(map.a, { status: 'added' });
    assert.deepEqual(map.b, { status: 'unchanged' });
    assert.deepEqual(map.c, {
      status: 'modified',
      loc: { from: 2, to: 5, delta: 3 },
    });
    assert.deepEqual(map.d, { status: 'removed' });
  });

  it('builds list added/removed arrays sorted', () => {
    const from = base({ import_files_list: ['z', 'a', 'a'] });
    const to = base({ import_files_list: ['b', 'a'] });

    const diff = diffResults(from, to, {});

    assert.deepEqual(diff.rules.import_files_list, {
      added: ['b'],
      removed: ['z'],
    });
  });

  it('builds hash diff changed flag and delta-only shape', () => {
    const from = base({ code_hash: { algorithm: 'sha256', file: 'abc' } });
    const to = base({ code_hash: { algorithm: 'sha256', file: 'def' } });

    const regular = diffResults(from, to, {});
    const delta = diffResults(from, to, { deltaOnly: true });

    assert.deepEqual(regular.rules.code_hash, {
      from: 'abc',
      to: 'def',
      changed: true,
    });
    assert.deepEqual(delta.rules.code_hash, { changed: true });
  });

  it('delta-only keeps status and uses plain deltas for numeric fields', () => {
    const from = base({ function_map: { x: { loc: 2 } } });
    const to = base({ function_map: { x: { loc: 7 } } });

    const diff = diffResults(from, to, { deltaOnly: true });

    assert.deepEqual(diff.rules.function_map, {
      x: { status: 'modified', loc: 5 },
    });
  });

  it('builds numeric deltas for file_metrics fields', () => {
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
        loc: 12,
        sloc: 9,
        tokens: 25,
        loops: 2,
        conditions: 3,
        cyclomaticComplexity: 6,
        cognitiveComplexity: 6,
        maxNestingDepth: 3,
      },
    });

    const diff = diffResults(from, to, {});

    assert.deepEqual(diff.rules.file_metrics, {
      cognitiveComplexity: { from: 4, to: 6, delta: 2 },
      conditions: { from: 2, to: 3, delta: 1 },
      cyclomaticComplexity: { from: 4, to: 6, delta: 2 },
      loc: { from: 10, to: 12, delta: 2 },
      loops: { from: 1, to: 2, delta: 1 },
      maxNestingDepth: { from: 2, to: 3, delta: 1 },
      sloc: { from: 8, to: 9, delta: 1 },
      tokens: { from: 20, to: 25, delta: 5 },
    });
  });

  it('builds delta-only numeric file_metrics fields', () => {
    const from = base({
      file_metrics: {
        loc: 3,
        sloc: 2,
        tokens: 7,
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
        tokens: 9,
        loops: 1,
        conditions: 2,
        cyclomaticComplexity: 4,
        cognitiveComplexity: 4,
        maxNestingDepth: 2,
      },
    });

    const diff = diffResults(from, to, { deltaOnly: true });

    assert.deepEqual(diff.rules.file_metrics, {
      cognitiveComplexity: 2,
      conditions: 1,
      cyclomaticComplexity: 2,
      loc: 2,
      loops: 1,
      maxNestingDepth: 1,
      sloc: 2,
      tokens: 2,
    });
  });

  it('omits rules when both values are null', () => {
    const from = base({ import_files_list: null });
    const to = base({ import_files_list: null });

    const diff = diffResults(from, to, {});

    assert.deepEqual(diff.rules, {});
  });

  it('throws InternalError for unsupported list shape', () => {
    const from = base({ import_files_list: ['a'] });
    const to = base({ import_files_list: ['a', 2] });

    assert.throws(
      () => diffResults(from, to, {}),
      new InternalError(
        'diff_shape_error: import_files_list expects string[] on to',
      ),
    );
  });

  it('diffs map entries with mixed numeric and non-numeric fields', () => {
    const from = base({
      function_map: {
        alpha: {
          modifiers: ['export'],
          params: ['a: string'],
          returns: ['number'],
          loc: 5,
          tokens: 12,
        },
      },
    });
    const to = base({
      function_map: {
        alpha: {
          modifiers: ['export'],
          params: ['a: string'],
          returns: ['number'],
          loc: 8,
          tokens: 20,
        },
      },
    });

    const diff = diffResults(from, to, { deltaOnly: true });
    assert.deepEqual(diff.rules.function_map, {
      alpha: { status: 'modified', loc: 3, tokens: 8 },
    });
  });

  it('diffs enriched function_map and method_map entries using numeric deltas only', () => {
    const from = base({
      function_map: {
        alpha: {
          modifiers: [],
          params: ['flag bool'],
          returns: ['error'],
          loc: 7,
          sloc: 7,
          cyclomaticComplexity: 2,
          cognitiveComplexity: 2,
          maxNestingDepth: 2,
          tokens: 18,
          sha256: 'aaa',
          loops: 0,
          conditions: 1,
          returnCount: 2,
          ioCallsCount: 1,
          ioReadCallsCount: 1,
          ioWriteCallsCount: 0,
        },
      },
      method_map: {
        serviceSave: {
          modifiers: [],
          receiver: 'Service',
          name: 'Save',
          params: [],
          returns: [],
          loc: 5,
          sloc: 5,
          cyclomaticComplexity: 2,
          cognitiveComplexity: 2,
          maxNestingDepth: 2,
          tokens: 12,
          sha256: 'bbb',
          loops: 1,
          conditions: 0,
          returnCount: 1,
          ioCallsCount: 1,
          ioReadCallsCount: 0,
          ioWriteCallsCount: 1,
        },
      },
    });
    const to = base({
      function_map: {
        alpha: {
          modifiers: [],
          params: ['flag bool'],
          returns: ['error'],
          loc: 8,
          sloc: 8,
          cyclomaticComplexity: 3,
          cognitiveComplexity: 3,
          maxNestingDepth: 3,
          tokens: 22,
          sha256: 'ccc',
          loops: 0,
          conditions: 2,
          returnCount: 3,
          ioCallsCount: 2,
          ioReadCallsCount: 1,
          ioWriteCallsCount: 1,
        },
      },
      method_map: {
        serviceSave: {
          modifiers: [],
          receiver: 'Service',
          name: 'Save',
          params: [],
          returns: [],
          loc: 6,
          sloc: 6,
          cyclomaticComplexity: 3,
          cognitiveComplexity: 3,
          maxNestingDepth: 3,
          tokens: 15,
          sha256: 'ddd',
          loops: 1,
          conditions: 1,
          returnCount: 2,
          ioCallsCount: 2,
          ioReadCallsCount: 1,
          ioWriteCallsCount: 1,
        },
      },
    });

    const regular = diffResults(from, to, {});
    const delta = diffResults(from, to, { deltaOnly: true });

    assert.deepEqual(regular.rules.function_map, {
      alpha: {
        status: 'modified',
        cognitiveComplexity: { from: 2, to: 3, delta: 1 },
        conditions: { from: 1, to: 2, delta: 1 },
        cyclomaticComplexity: { from: 2, to: 3, delta: 1 },
        ioCallsCount: { from: 1, to: 2, delta: 1 },
        ioReadCallsCount: { from: 1, to: 1, delta: 0 },
        ioWriteCallsCount: { from: 0, to: 1, delta: 1 },
        loc: { from: 7, to: 8, delta: 1 },
        loops: { from: 0, to: 0, delta: 0 },
        maxNestingDepth: { from: 2, to: 3, delta: 1 },
        returnCount: { from: 2, to: 3, delta: 1 },
        sloc: { from: 7, to: 8, delta: 1 },
        tokens: { from: 18, to: 22, delta: 4 },
      },
    });
    assert.deepEqual(regular.rules.method_map, {
      serviceSave: {
        status: 'modified',
        cognitiveComplexity: { from: 2, to: 3, delta: 1 },
        conditions: { from: 0, to: 1, delta: 1 },
        cyclomaticComplexity: { from: 2, to: 3, delta: 1 },
        ioCallsCount: { from: 1, to: 2, delta: 1 },
        ioReadCallsCount: { from: 0, to: 1, delta: 1 },
        ioWriteCallsCount: { from: 1, to: 1, delta: 0 },
        loc: { from: 5, to: 6, delta: 1 },
        loops: { from: 1, to: 1, delta: 0 },
        maxNestingDepth: { from: 2, to: 3, delta: 1 },
        returnCount: { from: 1, to: 2, delta: 1 },
        sloc: { from: 5, to: 6, delta: 1 },
        tokens: { from: 12, to: 15, delta: 3 },
      },
    });
    assert.deepEqual(delta.rules.function_map, {
      alpha: {
        status: 'modified',
        cognitiveComplexity: 1,
        conditions: 1,
        cyclomaticComplexity: 1,
        ioCallsCount: 1,
        ioReadCallsCount: 0,
        ioWriteCallsCount: 1,
        loc: 1,
        loops: 0,
        maxNestingDepth: 1,
        returnCount: 1,
        sloc: 1,
        tokens: 4,
      },
    });
    assert.deepEqual(delta.rules.method_map, {
      serviceSave: {
        status: 'modified',
        cognitiveComplexity: 1,
        conditions: 1,
        cyclomaticComplexity: 1,
        ioCallsCount: 1,
        ioReadCallsCount: 1,
        ioWriteCallsCount: 0,
        loc: 1,
        loops: 0,
        maxNestingDepth: 1,
        returnCount: 1,
        sloc: 1,
        tokens: 3,
      },
    });
  });
});
