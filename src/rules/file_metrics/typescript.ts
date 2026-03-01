import { computeSymbolMetrics } from '../_shared/typescript/metrics.js';
import type { RuleRunInput } from '../dispatch.js';

interface FileMetrics {
  loc: number;
  sloc: number;
  tokens: number;
  loops: number;
  conditions: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maxNestingDepth: number;
}

export const run = async (input: RuleRunInput): Promise<FileMetrics> => {
  const metrics = await computeSymbolMetrics(input.source, input.language);

  return {
    loc: metrics.loc,
    sloc: metrics.sloc,
    tokens: metrics.tokens,
    loops: metrics.loops,
    conditions: metrics.conditions,
    cyclomaticComplexity: metrics.cyclomaticComplexity,
    cognitiveComplexity: metrics.cognitiveComplexity,
    maxNestingDepth: metrics.maxNestingDepth,
  };
};
