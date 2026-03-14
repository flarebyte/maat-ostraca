import { InternalError } from '../../../core/errors/index.js';
import type { RuleRunInput } from '../../dispatch.js';
import {
  collectGoLiteralMatches,
  sortAndDedupGoStrings,
} from './string_literals.js';

const STATIC_CALL_PATTERNS = {
  errorsNew: /\berrors\.New\s*\(\s*("(?:[^"\\]|\\.)*"|`[^`]*`)/g,
  fmtErrorf: /\bfmt\.Errorf\s*\(\s*("(?:[^"\\]|\\.)*"|`[^`]*`)/g,
  logPrint: /\blog\.Print(?:f|ln)?\s*\(\s*("(?:[^"\\]|\\.)*"|`[^`]*`)/g,
  panic: /\bpanic\s*\(\s*("(?:[^"\\]|\\.)*"|`[^`]*`)/g,
} as const;

export const extractGoErrorMessages = (input: RuleRunInput): string[] => {
  if (input.language !== 'go') {
    throw new InternalError(
      `message_extract_error: unsupported language "${input.language}"`,
    );
  }

  try {
    return sortAndDedupGoStrings([
      ...collectGoLiteralMatches(input.source, STATIC_CALL_PATTERNS.errorsNew, {
        includeEmpty: true,
      }),
      ...collectGoLiteralMatches(input.source, STATIC_CALL_PATTERNS.fmtErrorf, {
        includeEmpty: true,
      }),
      ...collectGoLiteralMatches(input.source, STATIC_CALL_PATTERNS.logPrint, {
        includeEmpty: true,
      }),
      ...collectGoLiteralMatches(input.source, STATIC_CALL_PATTERNS.panic, {
        includeEmpty: true,
      }),
    ]);
  } catch {
    throw new InternalError(
      'message_extract_error: failed to extract error messages',
    );
  }
};

// Go has no Java/TypeScript-style exceptions. For v1, exception_messages_list
// is intentionally narrow and only reports static string literals passed
// directly to panic("...") or panic(`...`).
export const extractGoExceptionMessages = (input: RuleRunInput): string[] => {
  if (input.language !== 'go') {
    throw new InternalError(
      `message_extract_error: unsupported language "${input.language}"`,
    );
  }

  try {
    return sortAndDedupGoStrings(
      collectGoLiteralMatches(input.source, STATIC_CALL_PATTERNS.panic, {
        includeEmpty: true,
      }),
    );
  } catch {
    throw new InternalError(
      'message_extract_error: failed to extract exception messages',
    );
  }
};
