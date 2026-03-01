import type { RuleName } from '../../../rules/catalog.js';
import { assertObject } from './assertions.js';
import { isNumber, sortedKeys } from './common.js';

export type NumericDiff =
  | number
  | {
      from: number;
      to: number;
      delta: number;
    };

export const numericDiff = (
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

export const buildNumericFieldsDiff = (
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
