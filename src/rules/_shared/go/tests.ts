import { InternalError } from '../../../core/errors/index.js';
import type { RuleRunInput } from '../../dispatch.js';
import {
  collectGoLiteralMatches,
  sortAndDedupGoStrings,
} from './string_literals.js';

const TEST_TITLE_PATTERNS = [
  /\bt\.Run\s*\(\s*("(?:[^"\\]|\\.)*"|`[^`]*`)/g,
  /\bb\.Run\s*\(\s*("(?:[^"\\]|\\.)*"|`[^`]*`)/g,
] as const;

export const extractGoTestcaseTitles = (input: RuleRunInput): string[] => {
  if (input.language !== 'go') {
    throw new InternalError(
      `testcase_titles_extract_error: unsupported language "${input.language}"`,
    );
  }

  try {
    return sortAndDedupGoStrings(
      TEST_TITLE_PATTERNS.flatMap((pattern) =>
        collectGoLiteralMatches(input.source, pattern),
      ),
    );
  } catch {
    throw new InternalError(
      'testcase_titles_extract_error: failed to extract titles',
    );
  }
};
