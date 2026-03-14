import { countGoIoBySymbol } from '../_shared/go/io.js';
import { buildGoSymbolMetricsIoFields } from '../_shared/go/metrics.js';
import { extractGoSymbols } from '../_shared/go/symbols.js';
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
  const symbols = extractGoSymbols(input);
  const ioAll = countGoIoBySymbol(input, 'all');
  const ioRead = countGoIoBySymbol(input, 'read');
  const ioWrite = countGoIoBySymbol(input, 'write');

  for (const symbol of symbols.methods) {
    output[symbol.key] = {
      modifiers: symbol.modifiers,
      receiver: symbol.receiver,
      name: symbol.name,
      params: symbol.params,
      returns: symbol.returns,
      ...buildGoSymbolMetricsIoFields(symbol.code, {
        all: ioAll.methods[symbol.key] ?? 0,
        read: ioRead.methods[symbol.key] ?? 0,
        write: ioWrite.methods[symbol.key] ?? 0,
      }),
    };
  }

  return output;
};
