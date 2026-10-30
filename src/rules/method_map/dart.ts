import { buildMethodMap } from '../_shared/common.js';
import { analyseDartSymbols } from '../_shared/dart/symbol_analysis.js';
import type { RuleRunInput } from '../dispatch.js';

export const run = async (input: RuleRunInput) => {
  const { symbols, metrics } = analyseDartSymbols(input);
  return buildMethodMap(
    symbols.methods,
    (symbol) => symbol.key,
    (symbol) => metrics(symbol.bodySource, symbol.key, 'methods'),
  );
};
