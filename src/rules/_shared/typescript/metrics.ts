import { createHash } from 'node:crypto';
import { searchByKind } from '../../../core/astgrep/index.js';
import type { Language } from '../../../core/contracts/language.js';
import { InternalError } from '../../../core/errors/index.js';

export interface SymbolMetrics {
  loc: number;
  sloc: number;
  tokens: number;
  loops: number;
  conditions: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maxNestingDepth: number;
  returnCount: number;
}

const TOKEN_PATTERN = /[A-Za-z_$][A-Za-z0-9_$]*|\d+|[^\s]/g;

const LOOP_KINDS = [
  'for_statement',
  'for_in_statement',
  'while_statement',
  'do_statement',
] as const;

const CONDITION_KINDS = [
  'if_statement',
  'switch_case',
  'ternary_expression',
] as const;

const EXTRA_CYCLOMATIC_KINDS = ['catch_clause'] as const;

const countByKind = async (
  source: string,
  language: Language,
  kindName: string,
): Promise<number> => {
  const matches = await searchByKind({ source, language, kindName });
  return matches.length;
};

const computeMaxNestingDepth = (source: string): number => {
  let depth = 0;
  let maxDepth = 0;
  let inLineComment = false;
  let inBlockComment = false;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplate = false;
  let escaped = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (inSingleQuote || inDoubleQuote || inTemplate) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (inSingleQuote && char === "'") {
        inSingleQuote = false;
        continue;
      }
      if (inDoubleQuote && char === '"') {
        inDoubleQuote = false;
        continue;
      }
      if (inTemplate && char === '`') {
        inTemplate = false;
        continue;
      }
      continue;
    }

    if (char === '/' && next === '/') {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (char === '/' && next === '*') {
      inBlockComment = true;
      index += 1;
      continue;
    }

    if (char === "'") {
      inSingleQuote = true;
      continue;
    }
    if (char === '"') {
      inDoubleQuote = true;
      continue;
    }
    if (char === '`') {
      inTemplate = true;
      continue;
    }

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

// Deterministic metric definitions shared by file/symbol metrics:
// - loc/sloc/tokens: text-based stable counts on normalized source
// - loops/conditions/returnCount: ast-grep kind match counts
// - cyclomaticComplexity: 1 + loops + conditions + catchClauseCount (or 0 for empty source)
// - cognitiveComplexity: v1 approximation equal to cyclomaticComplexity
// - maxNestingDepth: stable brace-based approximation skipping comments/strings
export const computeSymbolMetrics = async (
  source: string,
  language: Language,
): Promise<SymbolMetrics> => {
  try {
    if (source.length === 0) {
      return {
        loc: 0,
        sloc: 0,
        tokens: 0,
        loops: 0,
        conditions: 0,
        cyclomaticComplexity: 0,
        cognitiveComplexity: 0,
        maxNestingDepth: 0,
        returnCount: 0,
      };
    }

    const lines = source.split('\n');
    const loc = lines.length;
    const sloc = lines.filter((line) => line.trim().length > 0).length;
    const tokens = source.match(TOKEN_PATTERN)?.length ?? 0;

    const loopCounts = await Promise.all(
      LOOP_KINDS.map((kindName) => countByKind(source, language, kindName)),
    );
    const loops = loopCounts.reduce((total, current) => total + current, 0);

    const conditionCounts = await Promise.all(
      CONDITION_KINDS.map((kindName) =>
        countByKind(source, language, kindName),
      ),
    );
    const conditions = conditionCounts.reduce(
      (total, current) => total + current,
      0,
    );

    const extraCyclomaticCounts = await Promise.all(
      EXTRA_CYCLOMATIC_KINDS.map((kindName) =>
        countByKind(source, language, kindName),
      ),
    );
    const extraCyclomatic = extraCyclomaticCounts.reduce(
      (total, current) => total + current,
      0,
    );

    const returnCount = await countByKind(source, language, 'return_statement');
    const cyclomaticComplexity = 1 + loops + conditions + extraCyclomatic;
    const cognitiveComplexity = cyclomaticComplexity;
    const maxNestingDepth = computeMaxNestingDepth(source);

    return {
      loc,
      sloc,
      tokens,
      loops,
      conditions,
      cyclomaticComplexity,
      cognitiveComplexity,
      maxNestingDepth,
      returnCount,
    };
  } catch {
    throw new InternalError('metrics_error: failed to compute metrics');
  }
};

export const sha256OfText = (text: string): string => {
  return createHash('sha256').update(text, 'utf8').digest('hex');
};
