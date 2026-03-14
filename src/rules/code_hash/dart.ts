import { InternalError } from '../../core/errors/index.js';
import { sha256OfText } from '../_shared/typescript/metrics.js';
import type { RuleRunInput } from '../dispatch.js';

interface CodeHashResult {
  algorithm: 'sha256';
  file: string;
}

export const run = async (input: RuleRunInput): Promise<CodeHashResult> => {
  if (input.language !== 'dart') {
    throw new InternalError(
      `code_hash_error: unsupported language "${input.language}"`,
    );
  }

  try {
    return {
      algorithm: 'sha256',
      file: sha256OfText(input.source),
    };
  } catch {
    throw new InternalError('code_hash_error: failed to compute hash');
  }
};
