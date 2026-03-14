import { InternalError } from '../../core/errors/index.js';
import {
  type CodeHashResult,
  computeCodeHashResult,
} from '../_shared/common.js';
import type { RuleRunInput } from '../dispatch.js';

export const run = async (input: RuleRunInput): Promise<CodeHashResult> => {
  if (input.language !== 'dart') {
    throw new InternalError(
      `code_hash_error: unsupported language "${input.language}"`,
    );
  }

  return computeCodeHashResult(
    input.source,
    'code_hash_error: failed to compute hash',
  );
};
