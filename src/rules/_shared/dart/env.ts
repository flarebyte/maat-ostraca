import { InternalError } from '../../../core/errors/index.js';
import type { RuleRunInput } from '../../dispatch.js';

const sortDedup = (values: string[]): string[] => {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
};

const STATIC_LITERAL_PATTERN = `(?:'(?:\\\\.|[^'\\\\\\n\\r])*'|"(?:\\\\.|[^"\\\\\\n\\r])*")`;

const INDEX_ACCESS_PATTERN = new RegExp(
  `\\bPlatform\\.environment\\s*\\[\\s*(${STATIC_LITERAL_PATTERN})\\s*\\]`,
  'g',
);

const CONTAINS_KEY_PATTERN = new RegExp(
  `\\bPlatform\\.environment\\.containsKey\\s*\\(\\s*(${STATIC_LITERAL_PATTERN})\\s*\\)`,
  'g',
);

const hasInterpolation = (literalBody: string): boolean => {
  return /(^|[^\\])\$(?:\{|\w)/.test(literalBody);
};

const decodeEscapes = (value: string): string => {
  return value.replace(
    /\\(?:u\{([0-9A-Fa-f]+)\}|u([0-9A-Fa-f]{4})|x([0-9A-Fa-f]{2})|([\\'"$nrbtfv]))/g,
    (
      _match: string,
      unicodeBrace: string | undefined,
      unicode: string | undefined,
      hex: string | undefined,
      simple: string | undefined,
    ) => {
      if (unicodeBrace !== undefined) {
        return String.fromCodePoint(Number.parseInt(unicodeBrace, 16));
      }
      if (unicode !== undefined) {
        return String.fromCodePoint(Number.parseInt(unicode, 16));
      }
      if (hex !== undefined) {
        return String.fromCodePoint(Number.parseInt(hex, 16));
      }
      if (simple === undefined) {
        return '';
      }

      switch (simple) {
        case 'n':
          return '\n';
        case 'r':
          return '\r';
        case 't':
          return '\t';
        case 'b':
          return '\b';
        case 'f':
          return '\f';
        case 'v':
          return '\v';
        case '\\':
          return '\\';
        case "'":
          return "'";
        case '"':
          return '"';
        case '$':
          return '$';
        default:
          return simple;
      }
    },
  );
};

const decodeDartStringLiteral = (literal: string): string | undefined => {
  if (
    (literal.startsWith("'") && literal.endsWith("'")) ||
    (literal.startsWith('"') && literal.endsWith('"'))
  ) {
    const body = literal.slice(1, -1);
    if (hasInterpolation(body)) {
      return undefined;
    }
    return decodeEscapes(body);
  }

  return undefined;
};

const collectMatches = (source: string, pattern: RegExp): string[] => {
  const values: string[] = [];

  for (const match of source.matchAll(pattern)) {
    const literal = match[1];
    if (literal === undefined) {
      continue;
    }

    const decoded = decodeDartStringLiteral(literal);
    if (decoded !== undefined && decoded !== '') {
      values.push(decoded);
    }
  }

  return values;
};

export const extractDartEnvNames = (input: RuleRunInput): string[] => {
  if (input.language !== 'dart') {
    throw new InternalError(
      `env_names_extract_error: unsupported language "${input.language}"`,
    );
  }

  try {
    return sortDedup([
      ...collectMatches(input.source, INDEX_ACCESS_PATTERN),
      ...collectMatches(input.source, CONTAINS_KEY_PATTERN),
    ]);
  } catch {
    throw new InternalError('env_names_extract_error: failed to extract names');
  }
};
