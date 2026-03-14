import { extractDartSymbols } from '../_shared/dart/symbols.js';
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

  for (const symbol of extractDartSymbols(input).classes) {
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
