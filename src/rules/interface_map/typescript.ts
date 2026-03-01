import { extractTypeScriptSymbols } from '../_shared/typescript/symbol_extract.js';
import type { RuleRunInput } from '../dispatch.js';

interface InterfaceMapEntry {
  modifiers: string[];
  extends: string[];
  methods: string[];
}

export const run = async (
  input: RuleRunInput,
): Promise<Record<string, InterfaceMapEntry>> => {
  const output: Record<string, InterfaceMapEntry> = {};
  const symbols = extractTypeScriptSymbols(input.source, input.language);

  for (const symbol of symbols.interfaces) {
    output[symbol.name] = {
      modifiers: symbol.modifiers,
      extends: symbol.extendsNames,
      methods: symbol.methods,
    };
  }

  return output;
};
