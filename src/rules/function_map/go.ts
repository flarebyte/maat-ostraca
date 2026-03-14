import { countGoIoBySymbol } from '../_shared/go/io.js';
import { buildGoSymbolMetricsIoFields } from '../_shared/go/metrics.js';
import { extractGoSymbols } from '../_shared/go/symbols.js';
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
  const symbols = extractGoSymbols(input);
  const ioAll = countGoIoBySymbol(input, 'all');
  const ioRead = countGoIoBySymbol(input, 'read');
  const ioWrite = countGoIoBySymbol(input, 'write');

  for (const symbol of symbols.functions) {
    output[symbol.name] = {
      modifiers: symbol.modifiers,
      params: symbol.params,
      returns: symbol.returns,
      ...buildGoSymbolMetricsIoFields(symbol.code, {
        all: ioAll.functions[symbol.name] ?? 0,
        read: ioRead.functions[symbol.name] ?? 0,
        write: ioWrite.functions[symbol.name] ?? 0,
      }),
    };
  }

  return output;
};
