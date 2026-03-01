import type { RuleName } from '../../../rules/catalog.js';
import { InternalError } from '../../errors/index.js';
import { isObject, type RuleValue } from './common.js';

export const assertObject = (
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

export const assertStringArray = (
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

export const readHashFile = (
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
