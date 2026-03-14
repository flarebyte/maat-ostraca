import { InternalError } from '../../core/errors/index.js';
import {
  type FileMetricsResult,
  toFileMetricsResult,
} from '../_shared/common.js';
import { computeGoMetrics } from '../_shared/go/metrics.js';
import type { RuleRunInput } from '../dispatch.js';

export const run = async (input: RuleRunInput): Promise<FileMetricsResult> => {
  if (input.language !== 'go') {
    throw new InternalError(
      `file_metrics_error: unsupported language "${input.language}"`,
    );
  }

  return toFileMetricsResult(computeGoMetrics(input.source));
};
