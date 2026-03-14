import { scanBalancedWithSkipper, splitTopLevelSegments } from '../common.js';

export const isGoIdentifierStart = (char: string | undefined): boolean => {
  return char !== undefined && /[A-Za-z_]/.test(char);
};

export const isGoIdentifierPart = (char: string | undefined): boolean => {
  return char !== undefined && /[A-Za-z0-9_]/.test(char);
};

export const skipGoCommentOrString = (
  source: string,
  start: number,
): number | undefined => {
  const char = source[start];
  const next = source[start + 1];
  let index = start;

  if (char === '/' && next === '/') {
    index += 2;
    while (index < source.length && source[index] !== '\n') {
      index += 1;
    }
    return index;
  }

  if (char === '/' && next === '*') {
    index += 2;
    while (index < source.length) {
      if (source[index] === '*' && source[index + 1] === '/') {
        return index + 2;
      }
      index += 1;
    }
    return index;
  }

  if (char === '"' || char === "'") {
    const quote = char;
    index += 1;
    let escaped = false;

    while (index < source.length) {
      const current = source[index];
      index += 1;
      if (escaped) {
        escaped = false;
        continue;
      }
      if (current === '\\') {
        escaped = true;
        continue;
      }
      if (current === quote) {
        break;
      }
    }

    return index;
  }

  if (char === '`') {
    index += 1;
    while (index < source.length) {
      const current = source[index];
      index += 1;
      if (current === '`') {
        break;
      }
    }
    return index;
  }

  return undefined;
};

export const skipGoWhitespaceAndComments = (
  source: string,
  start: number,
): number => {
  let index = start;

  while (index < source.length) {
    const char = source[index];

    if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
      index += 1;
      continue;
    }

    const skipped = skipGoCommentOrString(source, index);
    if (skipped !== undefined && skipped > index) {
      index = skipped;
      continue;
    }

    break;
  }

  return index;
};

export const scanGoIdentifier = (
  source: string,
  start: number,
): { text: string; end: number } | undefined => {
  if (!isGoIdentifierStart(source[start])) {
    return undefined;
  }

  let end = start + 1;
  while (isGoIdentifierPart(source[end])) {
    end += 1;
  }

  return {
    text: source.slice(start, end),
    end,
  };
};

export const scanGoBalanced = (
  source: string,
  start: number,
  open: string,
  close: string,
): { text: string; end: number } => {
  return scanBalancedWithSkipper(
    source,
    start,
    open,
    close,
    skipGoCommentOrString,
  );
};

export const matchesGoKeyword = (
  source: string,
  index: number,
  keyword: string,
): boolean => {
  return (
    source.startsWith(keyword, index) &&
    !isGoIdentifierPart(source[index - 1]) &&
    !isGoIdentifierPart(source[index + keyword.length])
  );
};

export const splitGoTopLevelSegments = (
  value: string,
  separators: readonly string[],
): string[] => {
  return splitTopLevelSegments(value, { separators });
};

export const stepGoTopLevelCursor = (
  source: string,
  index: number,
  braceDepth: number,
): { index: number; braceDepth: number; handled: boolean } => {
  const char = source[index];
  const skipped = skipGoCommentOrString(source, index);
  if (skipped !== undefined && skipped > index) {
    return { index: skipped, braceDepth, handled: true };
  }

  if (char === '{') {
    return {
      index: index + 1,
      braceDepth: braceDepth + 1,
      handled: true,
    };
  }

  if (char === '}') {
    return {
      index: index + 1,
      braceDepth: Math.max(0, braceDepth - 1),
      handled: true,
    };
  }

  return { index, braceDepth, handled: false };
};

export const forEachGoTopLevel = (
  source: string,
  visit: (index: number) => number | undefined,
): void => {
  let index = 0;
  let braceDepth = 0;

  while (index < source.length) {
    const step = stepGoTopLevelCursor(source, index, braceDepth);
    if (step.handled) {
      index = step.index;
      braceDepth = step.braceDepth;
      continue;
    }

    if (braceDepth === 0) {
      const nextIndex = visit(index);
      if (nextIndex !== undefined && nextIndex > index) {
        index = nextIndex;
        continue;
      }
    }

    index += 1;
  }
};
