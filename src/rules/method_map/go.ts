import { buildMethodMap } from '../_shared/common.js';
import { analyseGoSymbols } from '../_shared/go/symbol_analysis.js';
import type { RuleRunInput } from '../dispatch.js';

export const run = async (input: RuleRunInput) => {
  const { symbols, metrics } = analyseGoSymbols(input);
  return buildMethodMap(
    symbols.methods,
    (symbol) => symbol.key,
    (symbol) => metrics(symbol.code, symbol.key, 'methods'),
  );
};
