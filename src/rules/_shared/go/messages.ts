import { InternalError } from '../../../core/errors/index.js';
import type { RuleRunInput } from '../../dispatch.js';

const sortedDedup = (values: string[]): string[] => {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
};

const STATIC_CALL_PATTERNS = {
  errorsNew: /\berrors\.New\s*\(\s*("(?:[^"\\]|\\.)*"|`[^`]*`)/g,
  fmtErrorf: /\bfmt\.Errorf\s*\(\s*("(?:[^"\\]|\\.)*"|`[^`]*`)/g,
  logPrint: /\blog\.Print(?:f|ln)?\s*\(\s*("(?:[^"\\]|\\.)*"|`[^`]*`)/g,
  panic: /\bpanic\s*\(\s*("(?:[^"\\]|\\.)*"|`[^`]*`)/g,
} as const;

const decodeQuotedString = (value: string): string | undefined => {
  if (value.startsWith('`') && value.endsWith('`')) {
    return value.slice(1, -1);
  }

  try {
    return JSON.parse(value) as string;
  } catch {
    return undefined;
  }
};

const collectMatches = (source: string, pattern: RegExp): string[] => {
  const messages: string[] = [];

  for (const match of source.matchAll(pattern)) {
    const literal = match[1];
    if (literal === undefined) {
      continue;
    }

    const decoded = decodeQuotedString(literal);
    if (decoded !== undefined) {
      messages.push(decoded);
    }
  }

  return messages;
};

export const extractGoErrorMessages = (input: RuleRunInput): string[] => {
  if (input.language !== 'go') {
    throw new InternalError(
      `message_extract_error: unsupported language "${input.language}"`,
    );
  }

  try {
    return sortedDedup([
      ...collectMatches(input.source, STATIC_CALL_PATTERNS.errorsNew),
      ...collectMatches(input.source, STATIC_CALL_PATTERNS.fmtErrorf),
      ...collectMatches(input.source, STATIC_CALL_PATTERNS.logPrint),
      ...collectMatches(input.source, STATIC_CALL_PATTERNS.panic),
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
    return sortedDedup(
      collectMatches(input.source, STATIC_CALL_PATTERNS.panic),
    );
  } catch {
    throw new InternalError(
      'message_extract_error: failed to extract exception messages',
    );
  }
};
