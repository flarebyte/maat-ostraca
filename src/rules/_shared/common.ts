import { InternalError } from '../../core/errors/index.js';
import { sha256OfText } from './typescript/metrics.js';

export interface FileMetricsResult {
  loc: number;
  sloc: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maxNestingDepth: number;
  tokens: number;
  loops: number;
  conditions: number;
}

export const toFileMetricsResult = (
  metrics: FileMetricsResult,
): FileMetricsResult => {
  return {
    loc: metrics.loc,
    sloc: metrics.sloc,
    cyclomaticComplexity: metrics.cyclomaticComplexity,
    cognitiveComplexity: metrics.cognitiveComplexity,
    maxNestingDepth: metrics.maxNestingDepth,
    tokens: metrics.tokens,
    loops: metrics.loops,
    conditions: metrics.conditions,
  };
};

export interface CodeHashResult {
  algorithm: 'sha256';
  file: string;
}

export interface MethodMapStructuralFields {
  modifiers: string[];
  receiver: string;
  name: string;
  params: string[];
  returns: string[];
}

export interface InterfaceMapEntry {
  modifiers: string[];
  extends: string[];
  methods: string[];
}

export const countIdentifierMatches = (
  source: string,
  isIdentifierStart: (char: string | undefined) => boolean,
  isIdentifierPart: (char: string | undefined) => boolean,
  match: (text: string, start: number, end: number) => boolean,
): number => {
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

    if (match(source.slice(index, end), index, end)) {
      count += 1;
    }

    index = end;
  }

  return count;
};

export const computeBraceNestingDepth = (source: string): number => {
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

export const pushTrimmedEntry = (entries: string[], value: string): void => {
  const entry = value.trim();
  if (entry.length > 0) {
    entries.push(entry);
  }
};

export const skipWhitespaceWithSkipper = (
  source: string,
  start: number,
  skip: (source: string, index: number) => number | undefined,
): number => {
  let index = start;

  while (index < source.length) {
    const char = source[index];

    if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
      index += 1;
      continue;
    }

    const skipped = skip(source, index);
    if (skipped !== undefined && skipped > index) {
      index = skipped;
      continue;
    }

    break;
  }

  return index;
};

export const lowerCamel = (value: string): string => {
  if (value.length === 0) {
    return value;
  }

  return value.slice(0, 1).toLowerCase() + value.slice(1);
};

export const upperCamelSegment = (value: string): string => {
  if (value.length === 0) {
    return value;
  }

  return value.slice(0, 1).toUpperCase() + value.slice(1);
};

export const scanBalancedWithSkipper = (
  source: string,
  start: number,
  open: string,
  close: string,
  skip: (source: string, index: number) => number | undefined,
): { text: string; end: number } => {
  if (source[start] !== open) {
    throw new Error(`expected ${open}`);
  }

  let depth = 0;
  let index = start;

  while (index < source.length) {
    const char = source[index];
    const skipped = skip(source, index);
    if (skipped !== undefined && skipped > index) {
      index = skipped;
      continue;
    }

    if (char === open) {
      depth += 1;
    } else if (char === close) {
      depth -= 1;
      if (depth === 0) {
        return {
          text: source.slice(start + 1, index),
          end: index + 1,
        };
      }
    }

    index += 1;
  }

  throw new Error(`unbalanced ${open}${close}`);
};

export const splitTopLevelSegments = (
  value: string,
  options: {
    separators: readonly string[];
    skip?: (source: string, index: number) => number | undefined;
    trackAngles?: boolean;
    unwrapOptionalGroups?: boolean;
  },
): string[] => {
  const entries: string[] = [];
  let start = 0;
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let angleDepth = 0;

  for (let index = 0; index < value.length; index += 1) {
    const skipped = options.skip?.(value, index);
    if (skipped !== undefined && skipped > index) {
      index = skipped - 1;
      continue;
    }

    const char = value[index];

    if (char === '(') {
      parenDepth += 1;
      continue;
    }
    if (char === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
      continue;
    }
    if (char === '{') {
      braceDepth += 1;
      continue;
    }
    if (char === '}') {
      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }
    if (char === '[') {
      bracketDepth += 1;
      continue;
    }
    if (char === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }
    if (options.trackAngles && char === '<') {
      angleDepth += 1;
      continue;
    }
    if (options.trackAngles && char === '>') {
      angleDepth = Math.max(0, angleDepth - 1);
      continue;
    }

    const braceOkay = !options.unwrapOptionalGroups
      ? braceDepth === 0
      : braceDepth <= 1;
    const bracketOkay = !options.unwrapOptionalGroups
      ? bracketDepth === 0
      : bracketDepth <= 1;

    if (
      char !== undefined &&
      options.separators.includes(char) &&
      parenDepth === 0 &&
      angleDepth === 0 &&
      braceOkay &&
      bracketOkay
    ) {
      pushTrimmedEntry(entries, value.slice(start, index));
      start = index + 1;
    }
  }

  pushTrimmedEntry(entries, value.slice(start));
  return entries;
};

export const computeMetricSummary = <
  TExtra extends Record<string, number> = Record<never, never>,
>(
  source: string,
  normalized: string,
  tokenPattern: RegExp,
  counts: {
    loops: number;
    conditions: number;
  },
  extra?: TExtra,
) => {
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
      ...(extra ?? ({} as TExtra)),
    };
  }

  const lines = source.split('\n');
  const loc = lines.length;
  const sloc = lines.filter((line) => line.trim().length > 0).length;
  const cyclomaticComplexity = 1 + counts.loops + counts.conditions;

  return {
    loc,
    sloc,
    cyclomaticComplexity,
    cognitiveComplexity: cyclomaticComplexity,
    maxNestingDepth: computeBraceNestingDepth(normalized),
    tokens: normalized.match(tokenPattern)?.length ?? 0,
    loops: counts.loops,
    conditions: counts.conditions,
    ...(extra ?? ({} as TExtra)),
  };
};

export const countPatternMatches = (source: string, pattern: RegExp): number =>
  source.match(pattern)?.length ?? 0;

export const countPatternSetMatches = (
  source: string,
  patterns: readonly RegExp[],
): number => {
  return patterns.reduce(
    (total, pattern) => total + countPatternMatches(source, pattern),
    0,
  );
};

export const toSymbolCountRecord = (
  symbols: ReadonlyArray<{ key: string; bodySource: string }>,
  count: (bodySource: string) => number,
): Record<string, number> => {
  const output: Record<string, number> = {};

  for (const symbol of symbols) {
    output[symbol.key] = count(symbol.bodySource);
  }

  return output;
};

export const buildIoCountOutput = (
  symbols: {
    functions: ReadonlyArray<{ key: string; bodySource: string }>;
    methods: ReadonlyArray<{ key: string; bodySource: string }>;
  },
  count: (bodySource: string) => number,
): {
  functions: Record<string, number>;
  methods: Record<string, number>;
} => {
  return {
    functions: toSymbolCountRecord(symbols.functions, count),
    methods: toSymbolCountRecord(symbols.methods, count),
  };
};

export const countReadWritePatternMatches = (
  bodySource: string,
  mode: 'all' | 'read' | 'write',
  readPatterns: readonly RegExp[],
  writePatterns: readonly RegExp[],
): number => {
  const readCount = countPatternSetMatches(bodySource, readPatterns);
  const writeCount = countPatternSetMatches(bodySource, writePatterns);

  if (mode === 'read') {
    return readCount;
  }
  if (mode === 'write') {
    return writeCount;
  }

  return readCount + writeCount;
};

export const computeCodeHashResult = (
  source: string,
  errorMessage: string,
): CodeHashResult => {
  try {
    return {
      algorithm: 'sha256',
      file: sha256OfText(source),
    };
  } catch {
    throw new InternalError(errorMessage);
  }
};

export const buildMethodMap = <
  TSymbol extends MethodMapStructuralFields,
  TMetrics,
>(
  symbols: readonly TSymbol[],
  getKey: (symbol: TSymbol) => string,
  buildMetrics: (symbol: TSymbol, key: string) => Promise<TMetrics> | TMetrics,
): Promise<Record<string, MethodMapStructuralFields & TMetrics>> => {
  return symbols.reduce(
    async (outputPromise, symbol) => {
      const output = await outputPromise;
      const key = getKey(symbol);
      output[key] = {
        modifiers: symbol.modifiers,
        receiver: symbol.receiver,
        name: symbol.name,
        params: symbol.params,
        returns: symbol.returns,
        ...(await buildMetrics(symbol, key)),
      };
      return output;
    },
    Promise.resolve({} as Record<string, MethodMapStructuralFields & TMetrics>),
  );
};

export const buildInterfaceMap = <
  TSymbol extends {
    name: string;
    modifiers: string[];
    extendsNames: string[];
    methods: string[];
  },
>(
  symbols: readonly TSymbol[],
): Record<string, InterfaceMapEntry> => {
  const output: Record<string, InterfaceMapEntry> = {};

  for (const symbol of symbols) {
    output[symbol.name] = {
      modifiers: symbol.modifiers,
      extends: symbol.extendsNames,
      methods: symbol.methods,
    };
  }

  return output;
};
