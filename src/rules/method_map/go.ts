import { extractGoSymbols } from '../_shared/go/symbols.js';
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

  for (const symbol of extractGoSymbols(input).methods) {
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
