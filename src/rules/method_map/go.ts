import {
  buildMethodMap,
  type MethodMapStructuralFields,
} from '../_shared/common.js';
import { countGoIoBySymbol } from '../_shared/go/io.js';
import { buildGoSymbolMetricsIoFields } from '../_shared/go/metrics.js';
import { extractGoSymbols } from '../_shared/go/symbols.js';
import type { SymbolMetricsIoFields } from '../_shared/typescript/symbol_metrics_io.js';
import type { RuleRunInput } from '../dispatch.js';

interface MethodMapEntry
  extends MethodMapStructuralFields,
    SymbolMetricsIoFields {}

export const run = async (
  input: RuleRunInput,
): Promise<Record<string, MethodMapEntry>> => {
  const symbols = extractGoSymbols(input);
  const ioAll = countGoIoBySymbol(input, 'all');
  const ioRead = countGoIoBySymbol(input, 'read');
  const ioWrite = countGoIoBySymbol(input, 'write');

  return buildMethodMap(
    symbols.methods,
    (symbol) => symbol.key,
    (symbol, key) =>
      buildGoSymbolMetricsIoFields(symbol.code, {
        all: ioAll.methods[key] ?? 0,
        read: ioRead.methods[key] ?? 0,
        write: ioWrite.methods[key] ?? 0,
      }),
  );
};
