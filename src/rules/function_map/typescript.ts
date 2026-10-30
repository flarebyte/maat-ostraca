import {
  buildFunctionMap,
  type FunctionMapStructuralFields,
} from '../_shared/common.js';
import { countIoBySymbol } from '../_shared/typescript/io_count.js';
import { extractTypeScriptSymbols } from '../_shared/typescript/symbol_extract.js';
import {
  buildSymbolMetricsIoFields,
  type SymbolMetricsIoFields,
} from '../_shared/typescript/symbol_metrics_io.js';
import type { RuleRunInput } from '../dispatch.js';

export const run = async (
  input: RuleRunInput,
): Promise<
  Record<string, FunctionMapStructuralFields & SymbolMetricsIoFields>
> => {
  const symbols = await extractTypeScriptSymbols(input.source, input.language);
  const [ioAll, ioRead, ioWrite] = await Promise.all([
    countIoBySymbol(input.source, input.language, 'all'),
    countIoBySymbol(input.source, input.language, 'read'),
    countIoBySymbol(input.source, input.language, 'write'),
  ]);

  return buildFunctionMap(symbols.functions, (symbol) =>
    buildSymbolMetricsIoFields(symbol.code, input.language, {
      all: ioAll.functions[symbol.name] ?? 0,
      read: ioRead.functions[symbol.name] ?? 0,
      write: ioWrite.functions[symbol.name] ?? 0,
    }),
  );
};
