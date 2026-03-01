import { dispatchRule } from '../../rules/dispatch.js';
import type { RuleName } from '../../rules/index.js';
import type { Language } from '../contracts/language.js';
import type { AnalyseOutput } from '../contracts/outputs.js';
import { getRuleKind } from '../diff/rule-kinds.js';
import { InternalError, UsageError } from '../errors/index.js';

export interface AnalyseArgs {
  filename?: string;
  source: string;
  language: Language;
  rules: readonly RuleName[];
}

export interface RunAnalyseOptions {
  concurrency?: number;
  dispatch?: typeof dispatchRule;
}

const compareLex = (a: string, b: string): number => a.localeCompare(b);
const MAX_CONCURRENCY = 4;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

const sortStringList = (values: readonly string[]): string[] => {
  return [...values].sort(compareLex);
};

const deepSortObject = (
  value: Record<string, unknown>,
): Record<string, unknown> => {
  const sorted: Record<string, unknown> = {};

  for (const key of Object.keys(value).sort(compareLex)) {
    sorted[key] = deepNormalize(value[key]);
  }

  return sorted;
};

const deepNormalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    if (value.every((entry) => typeof entry === 'string')) {
      return sortStringList(value as string[]);
    }

    return value.map((entry) => deepNormalize(entry));
  }

  if (isRecord(value)) {
    return deepSortObject(value);
  }

  return value;
};

const normalizeRuleResult = (ruleName: RuleName, value: unknown): unknown => {
  const kind = getRuleKind(ruleName);

  if (kind === 'list') {
    if (
      !Array.isArray(value) ||
      !value.every((entry) => typeof entry === 'string')
    ) {
      throw new InternalError(
        `analyse_output_error: ${ruleName} must return string[]`,
      );
    }

    return sortStringList(value);
  }

  if (kind === 'counter') {
    if (typeof value === 'number') {
      return value;
    }

    if (!isRecord(value)) {
      throw new InternalError(
        `analyse_output_error: ${ruleName} must return number or object`,
      );
    }
  }

  return deepNormalize(value);
};

const executeRule = async (
  ruleName: RuleName,
  args: AnalyseArgs,
  dispatch: typeof dispatchRule,
): Promise<unknown> => {
  const runner = await dispatch(ruleName, args.language);

  try {
    const result = await runner({
      ...(args.filename ? { filename: args.filename } : {}),
      source: args.source,
      language: args.language,
    });

    return normalizeRuleResult(ruleName, result);
  } catch (error: unknown) {
    if (error instanceof UsageError || error instanceof InternalError) {
      throw error;
    }

    throw new InternalError(
      `rule_execution_error: ${ruleName} for language "${args.language}"`,
    );
  }
};

const normalizeConcurrency = (value: number | undefined): number => {
  if (value === undefined) {
    return MAX_CONCURRENCY;
  }

  if (!Number.isFinite(value)) {
    return MAX_CONCURRENCY;
  }

  return Math.max(1, Math.floor(value));
};

const runRulesBounded = async (
  sortedRules: readonly RuleName[],
  args: AnalyseArgs,
  options: RunAnalyseOptions,
): Promise<Map<RuleName, unknown>> => {
  const byRule = new Map<RuleName, unknown>();
  const failures = new Map<RuleName, unknown>();
  const dispatch = options.dispatch ?? dispatchRule;
  const requestedConcurrency = normalizeConcurrency(options.concurrency);
  const workerCount = Math.min(requestedConcurrency, sortedRules.length);
  let nextIndex = 0;
  let shouldStopScheduling = false;

  const worker = async (): Promise<void> => {
    while (true) {
      if (shouldStopScheduling) {
        return;
      }

      const ruleIndex = nextIndex;
      if (ruleIndex >= sortedRules.length) {
        return;
      }

      nextIndex += 1;
      const ruleName = sortedRules[ruleIndex];
      if (ruleName === undefined) {
        return;
      }

      try {
        const value = await executeRule(ruleName, args, dispatch);
        byRule.set(ruleName, value);
      } catch (error: unknown) {
        failures.set(ruleName, error);
        shouldStopScheduling = true;
      }
    }
  };

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      await worker();
    }),
  );

  if (failures.size > 0) {
    const firstFailingRule = [...failures.keys()].sort(compareLex)[0];
    if (firstFailingRule === undefined) {
      throw new InternalError('internal error');
    }
    const failure = failures.get(firstFailingRule);
    if (failure === undefined) {
      throw new InternalError('internal error');
    }
    throw failure;
  }

  return byRule;
};

export const runAnalyse = async (
  args: AnalyseArgs,
  options: RunAnalyseOptions = {},
): Promise<AnalyseOutput> => {
  const sortedRules = [...args.rules].sort(compareLex);

  // Sorting policy: rules are emitted in lexicographic name order, list-like
  // outputs are sorted, and object-like outputs are rebuilt with sorted keys.
  const byRule = await runRulesBounded(sortedRules, args, options);
  const rules: Record<string, unknown> = {};

  for (const ruleName of sortedRules) {
    rules[ruleName] = byRule.get(ruleName);
  }

  return {
    ...(args.filename ? { filename: args.filename } : {}),
    language: args.language,
    rules,
  };
};
