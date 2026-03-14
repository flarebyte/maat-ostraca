import { InternalError } from '../../core/errors/index.js';
import {
  type FileMetricsResult,
  toFileMetricsResult,
} from '../_shared/common.js';
import { computeDartMetrics } from '../_shared/dart/metrics.js';
import type { RuleRunInput } from '../dispatch.js';

export const run = async (input: RuleRunInput): Promise<FileMetricsResult> => {
  if (input.language !== 'dart') {
    throw new InternalError(
      `file_metrics_error: unsupported language "${input.language}"`,
    );
  }

  return toFileMetricsResult(computeDartMetrics(input.source));
};
