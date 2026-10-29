import type { RuleRunInput } from '../../dispatch.js';
import { countGoIoBySymbol } from './io.js';
import { buildGoSymbolMetricsIoFields } from './metrics.js';
import { extractGoSymbols } from './symbols.js';

export const analyseGoSymbols = (input: RuleRunInput) => {
  const symbols = extractGoSymbols(input);
  const all = countGoIoBySymbol(input, 'all');
  const read = countGoIoBySymbol(input, 'read');
  const write = countGoIoBySymbol(input, 'write');
  const metrics = (
    source: string,
    key: string,
    kind: 'functions' | 'methods',
  ) =>
    buildGoSymbolMetricsIoFields(source, {
      all: all[kind][key] ?? 0,
      read: read[kind][key] ?? 0,
      write: write[kind][key] ?? 0,
    });
  return { symbols, metrics };
};
