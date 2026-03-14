export const sortAndDedupDartStrings = (values: string[]): string[] => {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
};

export const DART_STRING_LITERAL_PATTERN =
  '(?:\'\'\'[\\s\\S]*?\'\'\'|"""[\\s\\S]*?"""|\'(?:\\\\.|[^\'\\\\\\n\\r])*\'|"(?:\\\\.|[^"\\\\\\n\\r])*")';

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

export const decodeDartStringLiteral = (
  literal: string,
  options?: { allowEmpty?: boolean },
): string | undefined => {
  const allowEmpty = options?.allowEmpty ?? true;

  if (literal.startsWith("'''") && literal.endsWith("'''")) {
    const body = literal.slice(3, -3);
    if (hasInterpolation(body) || (!allowEmpty && body === '')) {
      return undefined;
    }
    return body;
  }

  if (literal.startsWith('"""') && literal.endsWith('"""')) {
    const body = literal.slice(3, -3);
    if (hasInterpolation(body) || (!allowEmpty && body === '')) {
      return undefined;
    }
    return body;
  }

  if (
    (literal.startsWith("'") && literal.endsWith("'")) ||
    (literal.startsWith('"') && literal.endsWith('"'))
  ) {
    const body = literal.slice(1, -1);
    if (hasInterpolation(body)) {
      return undefined;
    }
    const decoded = decodeEscapes(body);
    return !allowEmpty && decoded === '' ? undefined : decoded;
  }

  return undefined;
};

export const collectDartLiteralMatches = (
  source: string,
  pattern: RegExp,
  options?: { allowEmpty?: boolean },
): string[] => {
  const values: string[] = [];

  for (const match of source.matchAll(pattern)) {
    const literal = match[1];
    if (literal === undefined) {
      continue;
    }

    const decoded = decodeDartStringLiteral(literal, options);
    if (decoded !== undefined) {
      values.push(decoded);
    }
  }

  return values;
};
