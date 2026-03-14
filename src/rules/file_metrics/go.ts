import { InternalError } from '../../core/errors/index.js';
import type { RuleRunInput } from '../dispatch.js';

interface FileMetrics {
  loc: number;
  sloc: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maxNestingDepth: number;
  tokens: number;
  loops: number;
  conditions: number;
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
        if (current === '\n') {
          output += '\n';
        } else {
          output += ' ';
        }
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

// Deterministic Go file metric definitions:
// - loc: number of lines after the project's normalized newline policy.
// - sloc: number of non-empty lines after trimming whitespace.
// - loops: count every Go `for` keyword outside comments and literals. This
//   covers infinite, conditional, C-style, and range loops because Go uses the
//   same keyword for all loop forms.
// - conditions: count every `if` keyword plus every non-default `case` clause.
//   `else if` contributes one via its `if` keyword. `switch` and `select`
//   clauses contribute through `case`; `default` does not count.
// - cyclomaticComplexity: 1 + loops + conditions for non-empty source, else 0.
// - cognitiveComplexity: v1 approximation equal to cyclomaticComplexity.
// - maxNestingDepth: maximum brace nesting depth after removing comments and
//   literals, which is stable across runs and independent of traversal order.
// - tokens: deterministic lexical heuristic using identifier/number/punctuation
//   matches on comment/string-stripped source without extra dependencies.
const computeGoFileMetrics = (source: string): FileMetrics => {
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
  const loops = countKeyword(normalized, 'for');
  const ifCount = countKeyword(normalized, 'if');
  const caseCount = countKeyword(normalized, 'case');
  const conditions = ifCount + caseCount;
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
};

export const run = async (input: RuleRunInput): Promise<FileMetrics> => {
  if (input.language !== 'go') {
    throw new InternalError(
      `file_metrics_error: unsupported language "${input.language}"`,
    );
  }

  try {
    return computeGoFileMetrics(input.source);
  } catch {
    throw new InternalError('metrics_error: failed to compute metrics');
  }
};
