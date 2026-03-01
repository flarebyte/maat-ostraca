import {
  computeSymbolMetrics,
  sha256OfText,
} from '../_shared/typescript/metrics.js';
import { extractTypeScriptSymbols } from '../_shared/typescript/symbol_extract.js';
import type { RuleRunInput } from '../dispatch.js';

interface ClassMapEntry {
  modifiers: string[];
  extends?: string;
  implements?: string[];
  methodCount: number;
  loc: number;
  sloc: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maxNestingDepth: number;
  tokens: number;
  sha256: string;
}

export const run = async (
  input: RuleRunInput,
): Promise<Record<string, ClassMapEntry>> => {
  const output: Record<string, ClassMapEntry> = {};
  const symbols = extractTypeScriptSymbols(input.source, input.language);

  for (const symbol of symbols.classes) {
    const metrics = await computeSymbolMetrics(symbol.code, input.language);
    output[symbol.name] = {
      modifiers: symbol.modifiers,
      ...(symbol.extendsName ? { extends: symbol.extendsName } : {}),
      ...(symbol.implementsNames.length > 0
        ? { implements: symbol.implementsNames }
        : {}),
      methodCount: symbol.methodCount,
      loc: metrics.loc,
      sloc: metrics.sloc,
      cyclomaticComplexity: metrics.cyclomaticComplexity,
      cognitiveComplexity: metrics.cognitiveComplexity,
      maxNestingDepth: metrics.maxNestingDepth,
      tokens: metrics.tokens,
      sha256: sha256OfText(symbol.code),
    };
  }

  return output;
};
