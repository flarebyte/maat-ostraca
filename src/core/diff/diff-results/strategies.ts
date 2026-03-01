import type { RuleName } from '../../../rules/catalog.js';
import { getRuleKind, type RuleKind } from '../rule-kinds.js';
import { assertObject, assertStringArray, readHashFile } from './assertions.js';
import {
  deepEqual,
  isNil,
  isNumber,
  type RuleValue,
  sortedKeys,
} from './common.js';
import { buildNumericFieldsDiff, numericDiff } from './numeric.js';

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

    if (
      fromEntry !== undefined &&
      toEntry !== undefined &&
      typeof fromEntry === 'object' &&
      fromEntry !== null &&
      !Array.isArray(fromEntry) &&
      typeof toEntry === 'object' &&
      toEntry !== null &&
      !Array.isArray(toEntry)
    ) {
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

export const diffRule = (
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
