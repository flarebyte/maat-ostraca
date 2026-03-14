import { InternalError } from '../../../core/errors/index.js';
import { computeMetricSummary, countIdentifierMatches } from '../common.js';
import { sha256OfText } from '../typescript/metrics.js';
import type { SymbolMetricsIoFields } from '../typescript/symbol_metrics_io.js';

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

export interface DartSymbolMetrics extends DartMetrics {
  returnCount: number;
}

export interface DartClassMetricsFields {
  loc: number;
  sloc: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maxNestingDepth: number;
  tokens: number;
  sha256: string;
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
  return countIdentifierMatches(
    source,
    isIdentifierStart,
    isIdentifierPart,
    (text) => text === keyword,
  );
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
  return countIdentifierMatches(
    source,
    isIdentifierStart,
    isIdentifierPart,
    (text, start) =>
      text === 'while' && previousNonWhitespaceOnLine(source, start) !== '}',
  );
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
    const normalized = stripCommentsAndStrings(source);
    const loops =
      countKeyword(normalized, 'for') +
      countKeyword(normalized, 'do') +
      countWhileLoops(normalized);
    const conditions =
      countKeyword(normalized, 'if') +
      countKeyword(normalized, 'case') +
      countTernaryOperators(normalized);
    return computeMetricSummary(source, normalized, TOKEN_PATTERN, {
      loops,
      conditions,
    });
  } catch {
    throw new InternalError('metrics_error: failed to compute metrics');
  }
};

// Deterministic Dart symbol metric definitions:
// - all shared counters reuse the file-level Dart metric rules above
// - returnCount: count each explicit `return` keyword outside comments/literals
//   within the exact extracted declaration text
export const computeDartSymbolMetrics = (source: string): DartSymbolMetrics => {
  const metrics = computeDartMetrics(source);

  if (source.length === 0) {
    return {
      ...metrics,
      returnCount: 0,
    };
  }

  try {
    const normalized = stripCommentsAndStrings(source);
    return {
      ...metrics,
      returnCount: countKeyword(normalized, 'return'),
    };
  } catch {
    throw new InternalError('metrics_error: failed to compute metrics');
  }
};

interface IoCounts {
  all: number;
  read: number;
  write: number;
}

export const buildDartSymbolMetricsIoFields = (
  code: string,
  ioCounts: IoCounts,
): SymbolMetricsIoFields => {
  const metrics = computeDartSymbolMetrics(code);

  return {
    loc: metrics.loc,
    sloc: metrics.sloc,
    cyclomaticComplexity: metrics.cyclomaticComplexity,
    cognitiveComplexity: metrics.cognitiveComplexity,
    maxNestingDepth: metrics.maxNestingDepth,
    tokens: metrics.tokens,
    sha256: sha256OfText(code),
    loops: metrics.loops,
    conditions: metrics.conditions,
    returnCount: metrics.returnCount,
    ioCallsCount: ioCounts.all,
    ioReadCallsCount: ioCounts.read,
    ioWriteCallsCount: ioCounts.write,
  };
};

export const buildDartClassMetricsFields = (
  code: string,
): DartClassMetricsFields => {
  const metrics = computeDartMetrics(code);

  return {
    loc: metrics.loc,
    sloc: metrics.sloc,
    cyclomaticComplexity: metrics.cyclomaticComplexity,
    cognitiveComplexity: metrics.cognitiveComplexity,
    maxNestingDepth: metrics.maxNestingDepth,
    tokens: metrics.tokens,
    sha256: sha256OfText(code),
  };
};
