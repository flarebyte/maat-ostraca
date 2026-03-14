import { InternalError } from '../../../core/errors/index.js';

export interface DartMetrics {
  loc: number;
  sloc: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maxNestingDepth: number;
  tokens: number;
  loops: number;
  conditions: number;
}

const TOKEN_PATTERN = /[A-Za-z_$][A-Za-z0-9_$]*|\d+|[^\s]/g;

const isIdentifierStart = (char: string | undefined): boolean => {
  return char !== undefined && /[A-Za-z_$]/.test(char);
};

const isIdentifierPart = (char: string | undefined): boolean => {
  return char !== undefined && /[A-Za-z0-9_$]/.test(char);
};

const readQuotedString = (
  source: string,
  start: number,
): { end: number; output: string } => {
  const quote = source[start];
  const triple =
    source[start + 1] === quote &&
    source[start + 2] === quote &&
    quote !== undefined;
  let index = start;
  let output = '';

  const appendWhitespace = (char: string | undefined) => {
    output += char === '\n' ? '\n' : ' ';
  };

  const advance = () => {
    appendWhitespace(source[index]);
    index += 1;
  };

  if (triple) {
    advance();
    advance();
    advance();

    while (index < source.length) {
      if (
        source[index] === quote &&
        source[index + 1] === quote &&
        source[index + 2] === quote
      ) {
        advance();
        advance();
        advance();
        break;
      }

      advance();
    }

    return { end: index, output };
  }

  advance();
  let escaped = false;

  while (index < source.length) {
    const char = source[index];
    advance();

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === quote) {
      break;
    }
  }

  return { end: index, output };
};

const stripCommentsAndStrings = (source: string): string => {
  let output = '';
  let index = 0;

  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];

    if (char === '/' && next === '/') {
      output += '  ';
      index += 2;
      while (index < source.length && source[index] !== '\n') {
        output += ' ';
        index += 1;
      }
      continue;
    }

    if (char === '/' && next === '*') {
      output += '  ';
      index += 2;
      while (index < source.length) {
        const current = source[index];
        const following = source[index + 1];
        output += current === '\n' ? '\n' : ' ';
        index += 1;
        if (current === '*' && following === '/') {
          output += ' ';
          index += 1;
          break;
        }
      }
      continue;
    }

    if ((char === 'r' || char === 'R') && (next === "'" || next === '"')) {
      output += ' ';
      index += 1;
      const rawString = readQuotedString(source, index);
      output += rawString.output;
      index = rawString.end;
      continue;
    }

    if (char === "'" || char === '"') {
      const stringToken = readQuotedString(source, index);
      output += stringToken.output;
      index = stringToken.end;
      continue;
    }

    output += char ?? '';
    index += 1;
  }

  return output;
};

const countKeyword = (source: string, keyword: string): number => {
  let count = 0;
  let index = 0;

  while (index < source.length) {
    if (!isIdentifierStart(source[index])) {
      index += 1;
      continue;
    }

    let end = index + 1;
    while (isIdentifierPart(source[end])) {
      end += 1;
    }

    if (source.slice(index, end) === keyword) {
      count += 1;
    }

    index = end;
  }

  return count;
};

const previousNonWhitespaceOnLine = (
  source: string,
  start: number,
): string | undefined => {
  let index = start - 1;
  while (index >= 0) {
    const char = source[index];
    if (char === '\n' || char === '\r') {
      return undefined;
    }
    if (char !== ' ' && char !== '\t' && char !== '\n' && char !== '\r') {
      return char;
    }
    index -= 1;
  }
  return undefined;
};

const countWhileLoops = (source: string): number => {
  let count = 0;
  let index = 0;

  while (index < source.length) {
    if (!isIdentifierStart(source[index])) {
      index += 1;
      continue;
    }

    let end = index + 1;
    while (isIdentifierPart(source[end])) {
      end += 1;
    }

    if (source.slice(index, end) === 'while') {
      const previous = previousNonWhitespaceOnLine(source, index);
      if (previous !== '}') {
        count += 1;
      }
    }

    index = end;
  }

  return count;
};

const countTernaryOperators = (source: string): number => {
  let count = 0;

  for (let index = 0; index < source.length; index += 1) {
    if (source[index] !== '?') {
      continue;
    }

    const next = source[index + 1];
    if (next === '?' || next === '.' || next === '[') {
      continue;
    }

    let parenDepth = 0;
    let bracketDepth = 0;
    let braceDepth = 0;

    for (let cursor = index + 1; cursor < source.length; cursor += 1) {
      const char = source[cursor];

      if (char === '(') {
        parenDepth += 1;
        continue;
      }
      if (char === ')') {
        if (parenDepth === 0) {
          break;
        }
        parenDepth -= 1;
        continue;
      }
      if (char === '[') {
        bracketDepth += 1;
        continue;
      }
      if (char === ']') {
        if (bracketDepth === 0) {
          break;
        }
        bracketDepth -= 1;
        continue;
      }
      if (char === '{') {
        braceDepth += 1;
        continue;
      }
      if (char === '}') {
        if (braceDepth === 0) {
          break;
        }
        braceDepth -= 1;
        continue;
      }

      if (
        parenDepth === 0 &&
        bracketDepth === 0 &&
        braceDepth === 0 &&
        char === ':'
      ) {
        count += 1;
        break;
      }

      if (
        parenDepth === 0 &&
        bracketDepth === 0 &&
        braceDepth === 0 &&
        (char === ';' || char === '\n')
      ) {
        break;
      }
    }
  }

  return count;
};

const computeMaxNestingDepth = (source: string): number => {
  let depth = 0;
  let maxDepth = 0;

  for (const char of source) {
    if (char === '{') {
      depth += 1;
      if (depth > maxDepth) {
        maxDepth = depth;
      }
      continue;
    }

    if (char === '}') {
      depth = Math.max(0, depth - 1);
    }
  }

  return maxDepth;
};

// Deterministic Dart metric definitions:
// - loc: number of lines in the normalized source string.
// - sloc: number of non-empty lines after trimming whitespace.
// - loops: count each `for`, `for in`, `while`, and `do ... while` construct
//   once outside comments and literals. The trailing `while` in `do ... while`
//   is excluded so that construct contributes a single loop.
// - conditions: count every `if` keyword, every `case` clause, and each
//   ternary `? :` operator. `else if` contributes through its `if` keyword.
// - cyclomaticComplexity: 1 + loops + conditions for non-empty source, else 0.
// - cognitiveComplexity: v1 approximation equal to cyclomaticComplexity.
// - maxNestingDepth: maximum brace nesting after stripping comments/literals.
// - tokens: lexical heuristic over the comment/string-stripped source.
export const computeDartMetrics = (source: string): DartMetrics => {
  try {
    if (source.length === 0) {
      return {
        loc: 0,
        sloc: 0,
        cyclomaticComplexity: 0,
        cognitiveComplexity: 0,
        maxNestingDepth: 0,
        tokens: 0,
        loops: 0,
        conditions: 0,
      };
    }

    const normalized = stripCommentsAndStrings(source);
    const lines = source.split('\n');
    const loc = lines.length;
    const sloc = lines.filter((line) => line.trim().length > 0).length;
    const loops =
      countKeyword(normalized, 'for') +
      countKeyword(normalized, 'do') +
      countWhileLoops(normalized);
    const conditions =
      countKeyword(normalized, 'if') +
      countKeyword(normalized, 'case') +
      countTernaryOperators(normalized);
    const cyclomaticComplexity = 1 + loops + conditions;
    const cognitiveComplexity = cyclomaticComplexity;
    const maxNestingDepth = computeMaxNestingDepth(normalized);
    const tokens = normalized.match(TOKEN_PATTERN)?.length ?? 0;

    return {
      loc,
      sloc,
      cyclomaticComplexity,
      cognitiveComplexity,
      maxNestingDepth,
      tokens,
      loops,
      conditions,
    };
  } catch {
    throw new InternalError('metrics_error: failed to compute metrics');
  }
};
