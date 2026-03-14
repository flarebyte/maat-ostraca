import { countDartIoBySymbol } from '../_shared/dart/io.js';
import { buildDartSymbolMetricsIoFields } from '../_shared/dart/metrics.js';
import { extractDartSymbols } from '../_shared/dart/symbols.js';
import type { SymbolMetricsIoFields } from '../_shared/typescript/symbol_metrics_io.js';
import type { RuleRunInput } from '../dispatch.js';

interface MethodMapEntry extends SymbolMetricsIoFields {
  modifiers: string[];
  receiver: string;
  name: string;
  params: string[];
  returns: string[];
}

export const run = async (
  input: RuleRunInput,
): Promise<Record<string, MethodMapEntry>> => {
  const output: Record<string, MethodMapEntry> = {};
  const symbols = extractDartSymbols(input);
  const ioAll = countDartIoBySymbol(input, 'all');
  const ioRead = countDartIoBySymbol(input, 'read');
  const ioWrite = countDartIoBySymbol(input, 'write');

  for (const symbol of symbols.methods) {
    output[symbol.key] = {
      modifiers: symbol.modifiers,
      receiver: symbol.receiver,
      name: symbol.name,
      params: symbol.params,
      returns: symbol.returns,
      ...buildDartSymbolMetricsIoFields(symbol.bodySource, {
        all: ioAll.methods[symbol.key] ?? 0,
        read: ioRead.methods[symbol.key] ?? 0,
        write: ioWrite.methods[symbol.key] ?? 0,
      }),
    };
  }

  return output;
};
