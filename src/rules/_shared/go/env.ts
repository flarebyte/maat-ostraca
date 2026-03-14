import { InternalError } from '../../../core/errors/index.js';
import type { RuleRunInput } from '../../dispatch.js';
import {
  collectGoLiteralMatches,
  sortAndDedupGoStrings,
} from './string_literals.js';

const ENV_CALL_PATTERNS = [
  /\bos\.Getenv\s*\(\s*("(?:[^"\\]|\\.)*"|`[^`]*`)/g,
  /\bos\.LookupEnv\s*\(\s*("(?:[^"\\]|\\.)*"|`[^`]*`)/g,
] as const;

export const extractGoEnvNames = (input: RuleRunInput): string[] => {
  if (input.language !== 'go') {
    throw new InternalError(
      `env_names_extract_error: unsupported language "${input.language}"`,
    );
  }

  try {
    return sortAndDedupGoStrings(
      ENV_CALL_PATTERNS.flatMap((pattern) =>
        collectGoLiteralMatches(input.source, pattern),
      ),
    );
  } catch {
    throw new InternalError('env_names_extract_error: failed to extract names');
  }
};
