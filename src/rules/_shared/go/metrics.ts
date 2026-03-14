import { InternalError } from '../../../core/errors/index.js';
import { sha256OfText } from '../typescript/metrics.js';
import type { SymbolMetricsIoFields } from '../typescript/symbol_metrics_io.js';

export interface GoMetrics {
  loc: number;
  sloc: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maxNestingDepth: number;
  tokens: number;
  loops: number;
  conditions: number;
  returnCount: number;
}

interface IoCounts {
  all: number;
  read: number;
  write: number;
}

const TOKEN_PATTERN = /[A-Za-z_][A-Za-z0-9_]*|\d+|[^\s]/g;

const isIdentifierStart = (char: string | undefined): boolean => {
  return char !== undefined && /[A-Za-z_]/.test(char);
};

const isIdentifierPart = (char: string | undefined): boolean => {
  return char !== undefined && /[A-Za-z0-9_]/.test(char);
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

    if (char === '`') {
      output += ' ';
      index += 1;
      while (index < source.length) {
        const current = source[index];
        output += current === '\n' ? '\n' : ' ';
        index += 1;
        if (current === '`') {
          break;
        }
      }
      continue;
    }

    if (char === '"' || char === "'") {
      const quote = char;
      output += ' ';
      index += 1;
      let escaped = false;

      while (index < source.length) {
        const current = source[index];
        output += current === '\n' ? '\n' : ' ';
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
    const char = source[index];
    if (!isIdentifierStart(char)) {
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

// Deterministic Go metric definitions:
// - loc: number of lines in the normalized source string.
// - sloc: number of non-empty lines after trimming whitespace.
// - loops: count every `for` keyword outside comments and literals. Go uses
//   `for` for infinite, conditional, C-style, and range loops.
// - conditions: count every `if` keyword and every non-default `case` clause.
//   `else if` contributes through `if`; `switch` and `select` contribute
//   through their `case` clauses.
// - cyclomaticComplexity: 1 + loops + conditions for non-empty source, else 0.
// - cognitiveComplexity: v1 approximation equal to cyclomaticComplexity.
// - maxNestingDepth: maximum brace nesting after stripping comments/literals.
// - tokens: lexical heuristic over the comment/string-stripped source.
// - returnCount: count every explicit `return` keyword outside comments and
//   literals inside the extracted declaration text.
export const computeGoMetrics = (source: string): GoMetrics => {
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
        returnCount: 0,
      };
    }

    const normalized = stripCommentsAndStrings(source);
    const lines = source.split('\n');
    const loc = lines.length;
    const sloc = lines.filter((line) => line.trim().length > 0).length;
    const loops = countKeyword(normalized, 'for');
    const conditions =
      countKeyword(normalized, 'if') + countKeyword(normalized, 'case');
    const cyclomaticComplexity = 1 + loops + conditions;
    const cognitiveComplexity = cyclomaticComplexity;
    const maxNestingDepth = computeMaxNestingDepth(normalized);
    const tokens = normalized.match(TOKEN_PATTERN)?.length ?? 0;
    const returnCount = countKeyword(normalized, 'return');

    return {
      loc,
      sloc,
      cyclomaticComplexity,
      cognitiveComplexity,
      maxNestingDepth,
      tokens,
      loops,
      conditions,
      returnCount,
    };
  } catch {
    throw new InternalError('metrics_error: failed to compute metrics');
  }
};

export const buildGoSymbolMetricsIoFields = (
  code: string,
  ioCounts: IoCounts,
): SymbolMetricsIoFields => {
  const metrics = computeGoMetrics(code);

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
