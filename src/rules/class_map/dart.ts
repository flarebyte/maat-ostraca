import { buildDartClassMetricsFields } from '../_shared/dart/metrics.js';
import { extractDartSymbols } from '../_shared/dart/symbols.js';
import type { RuleRunInput } from '../dispatch.js';

interface ClassMapEntry {
  modifiers: string[];
  extends?: string;
  implements?: string[];
  loc: number;
  sloc: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maxNestingDepth: number;
  tokens: number;
  sha256: string;
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
      ...buildDartClassMetricsFields(symbol.code),
      methodCount: symbol.methodCount,
    };
  }

  return output;
};
