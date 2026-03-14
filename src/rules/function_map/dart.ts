import { countDartIoBySymbol } from '../_shared/dart/io.js';
import { buildDartSymbolMetricsIoFields } from '../_shared/dart/metrics.js';
import { extractDartSymbols } from '../_shared/dart/symbols.js';
import type { SymbolMetricsIoFields } from '../_shared/typescript/symbol_metrics_io.js';
import type { RuleRunInput } from '../dispatch.js';

interface FunctionMapEntry extends SymbolMetricsIoFields {
  modifiers: string[];
  params: string[];
  returns: string[];
}

export const run = async (
  input: RuleRunInput,
): Promise<Record<string, FunctionMapEntry>> => {
  const output: Record<string, FunctionMapEntry> = {};
  const symbols = extractDartSymbols(input);
  const ioAll = countDartIoBySymbol(input, 'all');
  const ioRead = countDartIoBySymbol(input, 'read');
  const ioWrite = countDartIoBySymbol(input, 'write');

  for (const symbol of symbols.functions) {
    output[symbol.name] = {
      modifiers: symbol.modifiers,
      params: symbol.params,
      returns: symbol.returns,
      ...buildDartSymbolMetricsIoFields(symbol.bodySource, {
        all: ioAll.functions[symbol.name] ?? 0,
        read: ioRead.functions[symbol.name] ?? 0,
        write: ioWrite.functions[symbol.name] ?? 0,
      }),
    };
  }

  return output;
};
