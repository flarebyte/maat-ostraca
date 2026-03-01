import { extractTypeScriptSymbols } from '../_shared/typescript/symbol_extract.js';
import type { RuleRunInput } from '../dispatch.js';

interface MethodMapEntry {
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

  for (const symbol of symbols.methods) {
    output[symbol.key] = {
      modifiers: symbol.modifiers,
      receiver: symbol.receiver,
      name: symbol.name,
      params: symbol.params,
      returns: symbol.returns,
    };
  }

  return output;
};
