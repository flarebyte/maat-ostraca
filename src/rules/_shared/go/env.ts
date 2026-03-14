import { InternalError } from '../../../core/errors/index.js';
import type { RuleRunInput } from '../../dispatch.js';

const sortedDedup = (values: string[]): string[] => {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
};

const ENV_CALL_PATTERNS = [
  /\bos\.Getenv\s*\(\s*("(?:[^"\\]|\\.)*"|`[^`]*`)/g,
  /\bos\.LookupEnv\s*\(\s*("(?:[^"\\]|\\.)*"|`[^`]*`)/g,
] as const;

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
  const names: string[] = [];

  for (const match of source.matchAll(pattern)) {
    const literal = match[1];
    if (literal === undefined) {
      continue;
    }

    const decoded = decodeQuotedString(literal);
    if (decoded !== undefined && decoded !== '') {
      names.push(decoded);
    }
  }

  return names;
};

export const extractGoEnvNames = (input: RuleRunInput): string[] => {
  if (input.language !== 'go') {
    throw new InternalError(
      `env_names_extract_error: unsupported language "${input.language}"`,
    );
  }

  try {
    return sortedDedup(
      ENV_CALL_PATTERNS.flatMap((pattern) =>
        collectMatches(input.source, pattern),
      ),
    );
  } catch {
    throw new InternalError('env_names_extract_error: failed to extract names');
  }
};
