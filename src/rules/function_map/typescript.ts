import { countIoBySymbol } from '../_shared/typescript/io_count.js';
import {
  computeSymbolMetrics,
  sha256OfText,
} from '../_shared/typescript/metrics.js';
import { extractTypeScriptSymbols } from '../_shared/typescript/symbol_extract.js';
import type { RuleRunInput } from '../dispatch.js';

interface FunctionMapEntry {
  modifiers: string[];
  params: string[];
  returns: string[];
  loc: number;
  sloc: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maxNestingDepth: number;
  tokens: number;
  sha256: string;
  loops: number;
  conditions: number;
  returnCount: number;
  ioCallsCount: number;
  ioReadCallsCount: number;
  ioWriteCallsCount: number;
}

export const run = async (
  input: RuleRunInput,
): Promise<Record<string, FunctionMapEntry>> => {
  const output: Record<string, FunctionMapEntry> = {};
  const symbols = extractTypeScriptSymbols(input.source, input.language);
  const [ioAll, ioRead, ioWrite] = await Promise.all([
    countIoBySymbol(input.source, input.language, 'all'),
    countIoBySymbol(input.source, input.language, 'read'),
    countIoBySymbol(input.source, input.language, 'write'),
  ]);

  for (const symbol of symbols.functions) {
    const metrics = await computeSymbolMetrics(symbol.code, input.language);
    output[symbol.name] = {
      modifiers: symbol.modifiers,
      params: symbol.params,
      returns: symbol.returns,
      loc: metrics.loc,
      sloc: metrics.sloc,
      cyclomaticComplexity: metrics.cyclomaticComplexity,
      cognitiveComplexity: metrics.cognitiveComplexity,
      maxNestingDepth: metrics.maxNestingDepth,
      tokens: metrics.tokens,
      sha256: sha256OfText(symbol.code),
      loops: metrics.loops,
      conditions: metrics.conditions,
      returnCount: metrics.returnCount,
      ioCallsCount: ioAll.functions[symbol.name] ?? 0,
      ioReadCallsCount: ioRead.functions[symbol.name] ?? 0,
      ioWriteCallsCount: ioWrite.functions[symbol.name] ?? 0,
    };
  }

  return output;
};
