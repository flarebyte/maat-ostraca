import { buildFunctionMap } from '../_shared/common.js';
import { analyseGoSymbols } from '../_shared/go/symbol_analysis.js';
import type { RuleRunInput } from '../dispatch.js';

export const run = async (input: RuleRunInput) => {
  const { symbols, metrics } = analyseGoSymbols(input);
  return buildFunctionMap(
    symbols.functions,

    (symbol) => metrics(symbol.code, symbol.name, 'functions'),
  );
};
