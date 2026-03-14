import {
  buildMethodMap,
  type MethodMapStructuralFields,
} from '../_shared/common.js';
import { countDartIoBySymbol } from '../_shared/dart/io.js';
import { buildDartSymbolMetricsIoFields } from '../_shared/dart/metrics.js';
import { extractDartSymbols } from '../_shared/dart/symbols.js';
import type { SymbolMetricsIoFields } from '../_shared/typescript/symbol_metrics_io.js';
import type { RuleRunInput } from '../dispatch.js';

interface MethodMapEntry
  extends MethodMapStructuralFields,
    SymbolMetricsIoFields {}

export const run = async (
  input: RuleRunInput,
): Promise<Record<string, MethodMapEntry>> => {
  const symbols = extractDartSymbols(input);
  const ioAll = countDartIoBySymbol(input, 'all');
  const ioRead = countDartIoBySymbol(input, 'read');
  const ioWrite = countDartIoBySymbol(input, 'write');

  return buildMethodMap(
    symbols.methods,
    (symbol) => symbol.key,
    (symbol, key) =>
      buildDartSymbolMetricsIoFields(symbol.bodySource, {
        all: ioAll.methods[key] ?? 0,
        read: ioRead.methods[key] ?? 0,
        write: ioWrite.methods[key] ?? 0,
      }),
  );
};
