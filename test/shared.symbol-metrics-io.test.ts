import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildSymbolMetricsIoFieldsFromMetrics,
  type IoCounts,
} from '../src/rules/_shared/typescript/symbol_metrics_io.js';

describe('shared symbol metrics io helper', () => {
  it('assembles deterministic io-enriched metric fields from precomputed metrics', () => {
    const metrics = {
      loc: 7,
      sloc: 6,
      cyclomaticComplexity: 2,
      cognitiveComplexity: 2,
      maxNestingDepth: 3,
      tokens: 20,
      loops: 1,
      conditions: 0,
      returnCount: 1,
    };
    const ioCounts: IoCounts = {
      all: 3,
      read: 1,
      write: 2,
    };

    assert.deepEqual(
      buildSymbolMetricsIoFieldsFromMetrics(metrics, 'abc123', ioCounts),
      {
        loc: 7,
        sloc: 6,
        cyclomaticComplexity: 2,
        cognitiveComplexity: 2,
        maxNestingDepth: 3,
        tokens: 20,
        sha256: 'abc123',
        loops: 1,
        conditions: 0,
        returnCount: 1,
        ioCallsCount: 3,
        ioReadCallsCount: 1,
        ioWriteCallsCount: 2,
      },
    );
  });
});
