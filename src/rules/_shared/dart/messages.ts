import { InternalError } from '../../../core/errors/index.js';
import type { RuleRunInput } from '../../dispatch.js';
import {
  collectDartLiteralMatches,
  DART_STRING_LITERAL_PATTERN,
  sortAndDedupDartStrings,
} from './string_literals.js';

const STATIC_CALL_PATTERNS = {
  throwException: new RegExp(
    `\\bthrow\\s+(?:Exception|StateError|ArgumentError|FlutterError|FormatException)\\s*\\(\\s*(${DART_STRING_LITERAL_PATTERN})`,
    'g',
  ),
  print: new RegExp(`\\bprint\\s*\\(\\s*(${DART_STRING_LITERAL_PATTERN})`, 'g'),
  debugPrint: new RegExp(
    `\\bdebugPrint\\s*\\(\\s*(${DART_STRING_LITERAL_PATTERN})`,
    'g',
  ),
} as const;

export const extractDartErrorMessages = (input: RuleRunInput): string[] => {
  if (input.language !== 'dart') {
    throw new InternalError(
      `message_extract_error: unsupported language "${input.language}"`,
    );
  }

  try {
    return sortAndDedupDartStrings([
      ...collectDartLiteralMatches(
        input.source,
        STATIC_CALL_PATTERNS.throwException,
      ),
      ...collectDartLiteralMatches(input.source, STATIC_CALL_PATTERNS.print),
      ...collectDartLiteralMatches(
        input.source,
        STATIC_CALL_PATTERNS.debugPrint,
      ),
    ]);
  } catch {
    throw new InternalError(
      'message_extract_error: failed to extract error messages',
    );
  }
};

export const extractDartExceptionMessages = (input: RuleRunInput): string[] => {
  if (input.language !== 'dart') {
    throw new InternalError(
      `message_extract_error: unsupported language "${input.language}"`,
    );
  }

  try {
    return sortAndDedupDartStrings(
      collectDartLiteralMatches(
        input.source,
        STATIC_CALL_PATTERNS.throwException,
      ),
    );
  } catch {
    throw new InternalError(
      'message_extract_error: failed to extract exception messages',
    );
  }
};
