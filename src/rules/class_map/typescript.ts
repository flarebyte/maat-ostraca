import { extractTypeScriptSymbols } from '../_shared/typescript/symbol_extract.js';
import type { RuleRunInput } from '../dispatch.js';

interface ClassMapEntry {
  modifiers: string[];
  extends?: string;
  implements?: string[];
  methodCount: number;
}

export const run = async (
  input: RuleRunInput,
): Promise<Record<string, ClassMapEntry>> => {
  const output: Record<string, ClassMapEntry> = {};
  const symbols = extractTypeScriptSymbols(input.source, input.language);

  for (const symbol of symbols.classes) {
    output[symbol.name] = {
      modifiers: symbol.modifiers,
      ...(symbol.extendsName ? { extends: symbol.extendsName } : {}),
      ...(symbol.implementsNames.length > 0
        ? { implements: symbol.implementsNames }
        : {}),
      methodCount: symbol.methodCount,
    };
  }

  return output;
};
