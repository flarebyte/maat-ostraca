import { extractGoSymbols } from '../_shared/go/symbols.js';
import type { RuleRunInput } from '../dispatch.js';

interface FunctionMapEntry {
  modifiers: string[];
  params: string[];
  returns: string[];
}

export const run = async (
  input: RuleRunInput,
): Promise<Record<string, FunctionMapEntry>> => {
  const output: Record<string, FunctionMapEntry> = {};

  for (const symbol of extractGoSymbols(input).functions) {
    output[symbol.name] = {
      modifiers: symbol.modifiers,
      params: symbol.params,
      returns: symbol.returns,
    };
  }

  return output;
};
