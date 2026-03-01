import { countIoBySymbol } from '../_shared/typescript/io_count.js';
import { extractTypeScriptSymbols } from '../_shared/typescript/symbol_extract.js';
import {
  buildSymbolMetricsIoFields,
  type SymbolMetricsIoFields,
} from '../_shared/typescript/symbol_metrics_io.js';
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
  const symbols = await extractTypeScriptSymbols(input.source, input.language);
  const [ioAll, ioRead, ioWrite] = await Promise.all([
    countIoBySymbol(input.source, input.language, 'all'),
    countIoBySymbol(input.source, input.language, 'read'),
    countIoBySymbol(input.source, input.language, 'write'),
  ]);

  for (const symbol of symbols.functions) {
    const metricsIo = await buildSymbolMetricsIoFields(
      symbol.code,
      input.language,
      {
        all: ioAll.functions[symbol.name] ?? 0,
        read: ioRead.functions[symbol.name] ?? 0,
        write: ioWrite.functions[symbol.name] ?? 0,
      },
    );

    output[symbol.name] = {
      modifiers: symbol.modifiers,
      params: symbol.params,
      returns: symbol.returns,
      ...metricsIo,
    };
  }

  return output;
};
