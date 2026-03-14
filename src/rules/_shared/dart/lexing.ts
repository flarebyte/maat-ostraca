import {
  pushTrimmedEntry,
  scanBalancedWithSkipper,
  skipWhitespaceWithSkipper,
  splitTopLevelSegments,
} from '../common.js';

export const compareDartLex = (left: string, right: string): number =>
  left.localeCompare(right);

export const isDartIdentifierPart = (char: string | undefined): boolean => {
  return char !== undefined && /[A-Za-z0-9_$]/.test(char);
};

export const skipDartWhitespaceAndComments = (
  source: string,
  start: number,
): number => {
  return skipWhitespaceWithSkipper(source, start, (text, index) =>
    skipDartTriviaOrString(text, index, false),
  );
};

export const skipDartStringLiteral = (
  source: string,
  start: number,
): number => {
  const prefix = source[start];
  let quoteIndex = start;

  if (
    (prefix === 'r' || prefix === 'R') &&
    (source[start + 1] === "'" || source[start + 1] === '"')
  ) {
    quoteIndex += 1;
  }

  const quote = source[quoteIndex];
  const triple =
    source[quoteIndex + 1] === quote &&
    source[quoteIndex + 2] === quote &&
    quote !== undefined;
  let index = quoteIndex;

  if (triple) {
    index += 3;
    while (index < source.length) {
      if (
        source[index] === quote &&
        source[index + 1] === quote &&
        source[index + 2] === quote
      ) {
        return index + 3;
      }
      index += 1;
    }
    return index;
  }

  index += 1;
  let escaped = false;
  while (index < source.length) {
    const char = source[index];
    index += 1;

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\' && prefix !== 'r' && prefix !== 'R') {
      escaped = true;
      continue;
    }

    if (char === quote) {
      break;
    }
  }

  return index;
};

export const skipDartTriviaOrString = (
  source: string,
  start: number,
  includeStrings = true,
): number | undefined => {
  const char = source[start];
  const next = source[start + 1];

  if (char === '/' && next === '/') {
    let index = start + 2;
    while (index < source.length && source[index] !== '\n') {
      index += 1;
    }
    return index;
  }

  if (char === '/' && next === '*') {
    let index = start + 2;
    while (index < source.length) {
      if (source[index] === '*' && source[index + 1] === '/') {
        return index + 2;
      }
      index += 1;
    }
    return index;
  }

  if (
    includeStrings &&
    (char === "'" ||
      char === '"' ||
      ((char === 'r' || char === 'R') && (next === "'" || next === '"')))
  ) {
    return skipDartStringLiteral(source, start);
  }

  return undefined;
};

export const scanDartBalanced = (
  source: string,
  start: number,
  open: string,
  close: string,
): { text: string; end: number } => {
  return scanBalancedWithSkipper(source, start, open, close, (text, index) =>
    skipDartTriviaOrString(text, index),
  );
};

export const splitDartTopLevelCommaList = (
  value: string,
  options: { unwrapOptionalGroups?: boolean } = {},
): string[] => {
  return splitTopLevelSegments(value, {
    separators: [','],
    skip: (source, index) => skipDartTriviaOrString(source, index),
    trackAngles: true,
    ...(options.unwrapOptionalGroups === undefined
      ? {}
      : { unwrapOptionalGroups: options.unwrapOptionalGroups }),
  }).map((entry) => {
    let normalized = entry.trim();
    if (normalized.startsWith('{') || normalized.startsWith('[')) {
      normalized = normalized.slice(1).trim();
    }
    if (normalized.endsWith('}') || normalized.endsWith(']')) {
      normalized = normalized.slice(0, -1).trim();
    }
    return normalized;
  });
};

export const collectDartDeclarationSegments = (
  source: string,
  readDeclarationSegment: (
    source: string,
    start: number,
  ) => { text: string; end: number },
): string[] => {
  const segments: string[] = [];
  let index = 0;

  while (index < source.length) {
    index = skipDartWhitespaceAndComments(source, index);
    if (index >= source.length) {
      break;
    }

    const segment = readDeclarationSegment(source, index);
    pushTrimmedEntry(segments, segment.text);
    index = segment.end;
  }

  return segments;
};

export const readDartDeclarationSegment = (
  source: string,
  start: number,
): { text: string; end: number } => {
  let index = start;
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let angleDepth = 0;

  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];

    const skipped = skipDartTriviaOrString(source, index);
    if (skipped !== undefined && skipped > index) {
      index = skipped;
      continue;
    }

    if (char === '(') {
      parenDepth += 1;
      index += 1;
      continue;
    }
    if (char === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
      index += 1;
      continue;
    }
    if (char === '{') {
      if (
        parenDepth === 0 &&
        braceDepth === 0 &&
        bracketDepth === 0 &&
        angleDepth === 0
      ) {
        const block = scanDartBalanced(source, index, '{', '}');
        return {
          text: source.slice(start, block.end).trim(),
          end: block.end,
        };
      }

      braceDepth += 1;
      index += 1;
      continue;
    }
    if (char === '}') {
      braceDepth = Math.max(0, braceDepth - 1);
      index += 1;
      continue;
    }
    if (char === '[') {
      bracketDepth += 1;
      index += 1;
      continue;
    }
    if (char === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1);
      index += 1;
      continue;
    }
    if (char === '<') {
      angleDepth += 1;
      index += 1;
      continue;
    }
    if (char === '>') {
      angleDepth = Math.max(0, angleDepth - 1);
      index += 1;
      continue;
    }

    if (
      char === '=' &&
      next === '>' &&
      parenDepth === 0 &&
      braceDepth === 0 &&
      bracketDepth === 0 &&
      angleDepth === 0
    ) {
      index += 2;
      while (index < source.length) {
        const current = source[index];
        const following = source[index + 1];
        if (current === ';') {
          return {
            text: source.slice(start, index + 1).trim(),
            end: index + 1,
          };
        }
        if (
          current === "'" ||
          current === '"' ||
          ((current === 'r' || current === 'R') &&
            (following === "'" || following === '"'))
        ) {
          index = skipDartStringLiteral(source, index);
          continue;
        }
        index += 1;
      }
    }

    if (
      char === ';' &&
      parenDepth === 0 &&
      braceDepth === 0 &&
      bracketDepth === 0 &&
      angleDepth === 0
    ) {
      return {
        text: source.slice(start, index + 1).trim(),
        end: index + 1,
      };
    }

    index += 1;
  }

  return {
    text: source.slice(start).trim(),
    end: source.length,
  };
};

export const findDartParameterStart = (segment: string): number | undefined => {
  let index = 0;
  let angleDepth = 0;

  while (index < segment.length) {
    const char = segment[index];
    const next = segment[index + 1];

    if (
      char === "'" ||
      char === '"' ||
      ((char === 'r' || char === 'R') && (next === "'" || next === '"'))
    ) {
      index = skipDartStringLiteral(segment, index);
      continue;
    }

    if (char === '<') {
      angleDepth += 1;
      index += 1;
      continue;
    }
    if (char === '>') {
      angleDepth = Math.max(0, angleDepth - 1);
      index += 1;
      continue;
    }

    if (char === '(' && angleDepth === 0) {
      return index;
    }

    index += 1;
  }

  return undefined;
};
