import { countIoBySymbol } from '../_shared/typescript/io_count.js';
import { extractTypeScriptSymbols } from '../_shared/typescript/symbol_extract.js';
import {
  buildSymbolMetricsIoFields,
  type SymbolMetricsIoFields,
} from '../_shared/typescript/symbol_metrics_io.js';
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
  const symbols = extractTypeScriptSymbols(input.source, input.language);
  const [ioAll, ioRead, ioWrite] = await Promise.all([
    countIoBySymbol(input.source, input.language, 'all'),
    countIoBySymbol(input.source, input.language, 'read'),
    countIoBySymbol(input.source, input.language, 'write'),
  ]);

  for (const symbol of symbols.methods) {
    const metricsIo = await buildSymbolMetricsIoFields(
      symbol.code,
      input.language,
      {
        all: ioAll.methods[symbol.key] ?? 0,
        read: ioRead.methods[symbol.key] ?? 0,
        write: ioWrite.methods[symbol.key] ?? 0,
      },
    );

    output[symbol.key] = {
      modifiers: symbol.modifiers,
      receiver: symbol.receiver,
      name: symbol.name,
      params: symbol.params,
      returns: symbol.returns,
      ...metricsIo,
    };
  }

  return output;
};
