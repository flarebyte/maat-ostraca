import { InternalError } from '../../../core/errors/index.js';
import { computeMetricSummary, countIdentifierMatches } from '../common.js';
import { sha256OfText } from '../typescript/metrics.js';
import {
  buildSymbolMetricsIoFieldsFromMetrics,
  type IoCounts,
  type SymbolMetricsIoFields,
} from '../typescript/symbol_metrics_io.js';
import { isGoIdentifierPart, isGoIdentifierStart } from './lexing.js';

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

const TOKEN_PATTERN = /[A-Za-z_][A-Za-z0-9_]*|\d+|[^\s]/g;

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
  return countIdentifierMatches(
    source,
    isGoIdentifierStart,
    isGoIdentifierPart,
    (text) => text === keyword,
  );
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
    const normalized = stripCommentsAndStrings(source);
    const loops = countKeyword(normalized, 'for');
    const conditions =
      countKeyword(normalized, 'if') + countKeyword(normalized, 'case');
    return computeMetricSummary(
      source,
      normalized,
      TOKEN_PATTERN,
      {
        loops,
        conditions,
      },
      {
        returnCount:
          source.length === 0 ? 0 : countKeyword(normalized, 'return'),
      },
    );
  } catch {
    throw new InternalError('metrics_error: failed to compute metrics');
  }
};

export const buildGoSymbolMetricsIoFields = (
  code: string,
  ioCounts: IoCounts,
): SymbolMetricsIoFields => {
  const metrics = computeGoMetrics(code);
  return buildSymbolMetricsIoFieldsFromMetrics(
    metrics,
    sha256OfText(code),
    ioCounts,
  );
};
