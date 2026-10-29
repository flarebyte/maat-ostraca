import type { DiffOutput } from '../contracts/outputs.js';
import {
  isHashDiff,
  isListDiff,
  isNumericDelta,
  isStatusEntry,
} from './guards.js';

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const valueHasChanges = (value: unknown): boolean => {
  if (isListDiff(value)) {
    return value.added.length > 0 || value.removed.length > 0;
  }

  if (isHashDiff(value)) {
    return value.changed;
  }

  if (isNumericDelta(value)) {
    return value.delta !== 0;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (!isPlainObject(value)) {
    return false;
  }

  if (isStatusEntry(value)) {
    if (
      value.status === 'added' ||
      value.status === 'removed' ||
      value.status === 'modified'
    ) {
      return true;
    }

    return Object.entries(value)
      .filter(([key]) => key !== 'status')
      .some(([, entry]) => valueHasChanges(entry));
  }

  const entries = Object.values(value);
  if (entries.length === 0) {
    return false;
  }

  return entries.some((entry) => valueHasChanges(entry));
};

export const hasDiffChanges = (output: DiffOutput): boolean => {
  return Object.values(output.rules).some((value) => valueHasChanges(value));
};
