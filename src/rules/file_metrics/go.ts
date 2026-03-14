import { InternalError } from '../../core/errors/index.js';
import { computeGoMetrics } from '../_shared/go/metrics.js';
import type { RuleRunInput } from '../dispatch.js';

interface FileMetrics {
  loc: number;
  sloc: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maxNestingDepth: number;
  tokens: number;
  loops: number;
  conditions: number;
}

export const run = async (input: RuleRunInput): Promise<FileMetrics> => {
  if (input.language !== 'go') {
    throw new InternalError(
      `file_metrics_error: unsupported language "${input.language}"`,
    );
  }

  const metrics = computeGoMetrics(input.source);

  return {
    loc: metrics.loc,
    sloc: metrics.sloc,
    cyclomaticComplexity: metrics.cyclomaticComplexity,
    cognitiveComplexity: metrics.cognitiveComplexity,
    maxNestingDepth: metrics.maxNestingDepth,
    tokens: metrics.tokens,
    loops: metrics.loops,
    conditions: metrics.conditions,
  };
};
