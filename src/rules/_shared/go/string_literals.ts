export const sortAndDedupGoStrings = (values: string[]): string[] => {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
};

export const decodeGoQuotedString = (value: string): string | undefined => {
  if (value.startsWith('`') && value.endsWith('`')) {
    return value.slice(1, -1);
  }

  try {
    return JSON.parse(value) as string;
  } catch {
    return undefined;
  }
};

export const collectGoLiteralMatches = (
  source: string,
  pattern: RegExp,
  options?: { includeEmpty?: boolean },
): string[] => {
  const values: string[] = [];
  const includeEmpty = options?.includeEmpty ?? false;

  for (const match of source.matchAll(pattern)) {
    const literal = match[1];
    if (literal === undefined) {
      continue;
    }

    const decoded = decodeGoQuotedString(literal);
    if (decoded === undefined) {
      continue;
    }

    if (includeEmpty || decoded !== '') {
      values.push(decoded);
    }
  }

  return values;
};
