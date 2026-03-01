import { extractTypeScriptSymbols } from '../_shared/typescript/symbol_extract.js';
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
  const symbols = extractTypeScriptSymbols(input.source, input.language);

  for (const symbol of symbols.functions) {
    output[symbol.name] = {
      modifiers: symbol.modifiers,
      params: symbol.params,
      returns: symbol.returns,
    };
  }

  return output;
};
