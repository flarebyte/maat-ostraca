import { InternalError } from '../../../core/errors/index.js';
import type { RuleRunInput } from '../../dispatch.js';
import {
  collectDartLiteralMatches,
  sortAndDedupDartStrings,
} from './string_literals.js';

const STATIC_LITERAL_PATTERN = `(?:'(?:\\\\.|[^'\\\\\\n\\r])*'|"(?:\\\\.|[^"\\\\\\n\\r])*")`;

const INDEX_ACCESS_PATTERN = new RegExp(
  `\\bPlatform\\.environment\\s*\\[\\s*(${STATIC_LITERAL_PATTERN})\\s*\\]`,
  'g',
);

const CONTAINS_KEY_PATTERN = new RegExp(
  `\\bPlatform\\.environment\\.containsKey\\s*\\(\\s*(${STATIC_LITERAL_PATTERN})\\s*\\)`,
  'g',
);

export const extractDartEnvNames = (input: RuleRunInput): string[] => {
  if (input.language !== 'dart') {
    throw new InternalError(
      `env_names_extract_error: unsupported language "${input.language}"`,
    );
  }

  try {
    return sortAndDedupDartStrings([
      ...collectDartLiteralMatches(input.source, INDEX_ACCESS_PATTERN, {
        allowEmpty: false,
      }),
      ...collectDartLiteralMatches(input.source, CONTAINS_KEY_PATTERN, {
        allowEmpty: false,
      }),
    ]);
  } catch {
    throw new InternalError('env_names_extract_error: failed to extract names');
  }
};
