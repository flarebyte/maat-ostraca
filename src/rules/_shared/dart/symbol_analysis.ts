import type { RuleRunInput } from '../../dispatch.js';
import { countDartIoBySymbol } from './io.js';
import { buildDartSymbolMetricsIoFields } from './metrics.js';
import { extractDartSymbols } from './symbols.js';

export const analyseDartSymbols = (input: RuleRunInput) => {
  const symbols = extractDartSymbols(input);
  const all = countDartIoBySymbol(input, 'all');
  const read = countDartIoBySymbol(input, 'read');
  const write = countDartIoBySymbol(input, 'write');
  const metrics = (
    source: string,
    key: string,
    kind: 'functions' | 'methods',
  ) =>
    buildDartSymbolMetricsIoFields(source, {
      all: all[kind][key] ?? 0,
      read: read[kind][key] ?? 0,
      write: write[kind][key] ?? 0,
    });
  return { symbols, metrics };
};
