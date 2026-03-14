import { InternalError } from '../../../core/errors/index.js';
import type { RuleRunInput } from '../../dispatch.js';
import {
  collectDartLiteralMatches,
  DART_STRING_LITERAL_PATTERN,
  sortAndDedupDartStrings,
} from './string_literals.js';

const TEST_TITLE_PATTERNS = [
  new RegExp(`\\btest\\s*\\(\\s*(${DART_STRING_LITERAL_PATTERN})\\s*,`, 'g'),
  new RegExp(
    `\\btestWidgets\\s*\\(\\s*(${DART_STRING_LITERAL_PATTERN})\\s*,`,
    'g',
  ),
  new RegExp(`\\bgroup\\s*\\(\\s*(${DART_STRING_LITERAL_PATTERN})\\s*,`, 'g'),
] as const;

export const extractDartTestcaseTitles = (input: RuleRunInput): string[] => {
  if (input.language !== 'dart') {
    throw new InternalError(
      `testcase_titles_extract_error: unsupported language "${input.language}"`,
    );
  }

  try {
    return sortAndDedupDartStrings(
      TEST_TITLE_PATTERNS.flatMap((pattern) =>
        collectDartLiteralMatches(input.source, pattern, { allowEmpty: false }),
      ),
    );
  } catch {
    throw new InternalError(
      'testcase_titles_extract_error: failed to extract titles',
    );
  }
};
