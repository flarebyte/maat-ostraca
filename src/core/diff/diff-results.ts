import type { RuleName } from '../../rules/catalog.js';
import type { AnalyseOutput, DiffOutput } from '../contracts/outputs.js';
import { InternalError } from '../errors/index.js';
import { getRuleKind, type RuleKind } from './rule-kinds.js';

type RuleValue = unknown;

type NumericDiff =
  | number
  | {
      from: number;
      to: number;
      delta: number;
    };

interface DiffOptions {
  deltaOnly?: boolean;
}

const isObject = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value);
};

const deepEqual = (a: unknown, b: unknown): boolean => {
  return JSON.stringify(a) === JSON.stringify(b);
};

const sortedKeys = (value: Record<string, unknown>): string[] => {
  return Object.keys(value).sort((a, b) => a.localeCompare(b));
};

const numericDiff = (
  from: number,
  to: number,
  deltaOnly: boolean,
): NumericDiff => {
  const delta = to - from;
  if (deltaOnly) {
    return delta;
  }

  return { from, to, delta };
};

const assertObject = (
  rule: RuleName,
  value: unknown,
  side: 'from' | 'to',
): Record<string, unknown> => {
  if (!isObject(value)) {
    throw new InternalError(
      `diff_shape_error: ${rule} expects object on ${side}`,
    );
  }

  return value;
};

const assertStringArray = (
  rule: RuleName,
  value: unknown,
  side: 'from' | 'to',
): string[] => {
  if (!Array.isArray(value)) {
    throw new InternalError(
      `diff_shape_error: ${rule} expects string[] on ${side}`,
    );
  }

  for (const entry of value) {
    if (typeof entry !== 'string') {
      throw new InternalError(
        `diff_shape_error: ${rule} expects string[] on ${side}`,
      );
    }
  }

  return value;
};

const buildNumericFieldsDiff = (
  rule: RuleName,
  fromValue: unknown,
  toValue: unknown,
  deltaOnly: boolean,
): Record<string, NumericDiff> => {
  const fromObject = assertObject(rule, fromValue, 'from');
  const toObject = assertObject(rule, toValue, 'to');

  const fields = new Set<string>([
    ...sortedKeys(fromObject),
    ...sortedKeys(toObject),
  ]);
  const output: Record<string, NumericDiff> = {};

  for (const field of [...fields].sort((a, b) => a.localeCompare(b))) {
    const fromNumber = fromObject[field];
    const toNumber = toObject[field];

    if (!isNumber(fromNumber) || !isNumber(toNumber)) {
      continue;
    }

    output[field] = numericDiff(fromNumber, toNumber, deltaOnly);
  }

  return output;
};

const diffMapRule = (
  rule: RuleName,
  fromValue: RuleValue,
  toValue: RuleValue,
  deltaOnly: boolean,
): unknown => {
  const fromObject = assertObject(rule, fromValue, 'from');
  const toObject = assertObject(rule, toValue, 'to');

  const keys = [
    ...new Set<string>([...sortedKeys(fromObject), ...sortedKeys(toObject)]),
  ].sort((a, b) => a.localeCompare(b));
  const output: Record<string, unknown> = {};

  for (const key of keys) {
    const fromEntry = fromObject[key];
    const toEntry = toObject[key];

    if (fromEntry === undefined && toEntry !== undefined) {
      output[key] = { status: 'added' };
      continue;
    }

    if (fromEntry !== undefined && toEntry === undefined) {
      output[key] = { status: 'removed' };
      continue;
    }

    if (deepEqual(fromEntry, toEntry)) {
      output[key] = { status: 'unchanged' };
      continue;
    }

    const entry: Record<string, unknown> = { status: 'modified' };

    if (isObject(fromEntry) && isObject(toEntry)) {
      const fields = buildNumericFieldsDiff(
        rule,
        fromEntry,
        toEntry,
        deltaOnly,
      );
      for (const field of Object.keys(fields)) {
        entry[field] = fields[field];
      }
    }

    output[key] = entry;
  }

  return output;
};

const diffListRule = (
  rule: RuleName,
  fromValue: RuleValue,
  toValue: RuleValue,
): unknown => {
  const fromList = assertStringArray(rule, fromValue, 'from');
  const toList = assertStringArray(rule, toValue, 'to');

  const fromSet = new Set(fromList);
  const toSet = new Set(toList);

  const added = [...toSet]
    .filter((item) => !fromSet.has(item))
    .sort((a, b) => a.localeCompare(b));
  const removed = [...fromSet]
    .filter((item) => !toSet.has(item))
    .sort((a, b) => a.localeCompare(b));

  return { added, removed };
};

const diffMetricsRule = (
  rule: RuleName,
  fromValue: RuleValue,
  toValue: RuleValue,
  deltaOnly: boolean,
): unknown => {
  return buildNumericFieldsDiff(rule, fromValue, toValue, deltaOnly);
};

const readHashFile = (
  rule: RuleName,
  value: RuleValue,
  side: 'from' | 'to',
): string => {
  const objectValue = assertObject(rule, value, side) as { file?: unknown };
  const hash = objectValue.file;

  if (typeof hash !== 'string') {
    throw new InternalError(
      `diff_shape_error: ${rule}.file expects string on ${side}`,
    );
  }

  return hash;
};

const diffHashRule = (
  rule: RuleName,
  fromValue: RuleValue,
  toValue: RuleValue,
  deltaOnly: boolean,
): unknown => {
  const fromHash = readHashFile(rule, fromValue, 'from');
  const toHash = readHashFile(rule, toValue, 'to');
  const changed = fromHash !== toHash;

  if (deltaOnly) {
    return { changed };
  }

  return {
    from: fromHash,
    to: toHash,
    changed,
  };
};

const diffCounterRule = (
  rule: RuleName,
  fromValue: RuleValue,
  toValue: RuleValue,
  deltaOnly: boolean,
): unknown => {
  if (isNumber(fromValue) && isNumber(toValue)) {
    return numericDiff(fromValue, toValue, deltaOnly);
  }

  return diffMapRule(rule, fromValue, toValue, deltaOnly);
};

const diffByKind = (
  rule: RuleName,
  kind: RuleKind,
  fromValue: RuleValue,
  toValue: RuleValue,
  deltaOnly: boolean,
): unknown => {
  switch (kind) {
    case 'map':
      return diffMapRule(rule, fromValue, toValue, deltaOnly);
    case 'list':
      return diffListRule(rule, fromValue, toValue);
    case 'metrics':
      return diffMetricsRule(rule, fromValue, toValue, deltaOnly);
    case 'hash':
      return diffHashRule(rule, fromValue, toValue, deltaOnly);
    case 'counter':
      return diffCounterRule(rule, fromValue, toValue, deltaOnly);
    default:
      return diffMapRule(rule, fromValue, toValue, deltaOnly);
  }
};

const isNil = (value: unknown): boolean =>
  value === null || value === undefined;

const diffRule = (
  rule: RuleName,
  fromValue: RuleValue,
  toValue: RuleValue,
  deltaOnly: boolean,
): unknown => {
  // v1 placeholder policy: if both snapshots have null/undefined for a rule,
  // omit that rule from diff output entirely for deterministic minimal payloads.
  if (isNil(fromValue) && isNil(toValue)) {
    return undefined;
  }

  if (isNil(fromValue) && !isNil(toValue)) {
    return { status: 'added' };
  }

  if (!isNil(fromValue) && isNil(toValue)) {
    return { status: 'removed' };
  }

  return diffByKind(rule, getRuleKind(rule), fromValue, toValue, deltaOnly);
};

export const diffResults = (
  fromOutput: AnalyseOutput,
  toOutput: AnalyseOutput,
  options: DiffOptions,
): DiffOutput => {
  const deltaOnly = Boolean(options.deltaOnly);

  if (!fromOutput.filename) {
    throw new InternalError(
      'diff_input_error: from output filename is required',
    );
  }

  if (fromOutput.language !== toOutput.language) {
    throw new InternalError(
      'diff_input_error: language mismatch between snapshots',
    );
  }

  const fromRules = isObject(fromOutput.rules) ? fromOutput.rules : {};
  const toRules = isObject(toOutput.rules) ? toOutput.rules : {};

  const ruleNames = [
    ...new Set<string>([...Object.keys(fromRules), ...Object.keys(toRules)]),
  ].sort((a, b) => a.localeCompare(b));
  const rules: Record<string, unknown> = {};

  for (const ruleName of ruleNames) {
    const diff = diffRule(
      ruleName as RuleName,
      fromRules[ruleName],
      toRules[ruleName],
      deltaOnly,
    );
    if (diff !== undefined) {
      rules[ruleName] = diff;
    }
  }

  return {
    from: {
      filename: fromOutput.filename,
      language: fromOutput.language,
    },
    to: {
      ...(toOutput.filename ? { filename: toOutput.filename } : {}),
      language: toOutput.language,
    },
    ...(deltaOnly ? { deltaOnly: true } : {}),
    rules,
  };
};
