import type { DiffOutput } from '../contracts/outputs.js';

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isListDiff = (
  value: unknown,
): value is { added: unknown[]; removed: unknown[] } => {
  if (!isPlainObject(value)) {
    return false;
  }

  const candidate = value as { added?: unknown; removed?: unknown };
  return Array.isArray(candidate.added) && Array.isArray(candidate.removed);
};

const isNumericDelta = (
  value: unknown,
): value is { from: number; to: number; delta: number } => {
  if (!isPlainObject(value)) {
    return false;
  }

  const candidate = value as { from?: unknown; to?: unknown; delta?: unknown };
  return (
    typeof candidate.from === 'number' &&
    typeof candidate.to === 'number' &&
    typeof candidate.delta === 'number'
  );
};

const isHashDiff = (value: unknown): value is { changed: boolean } => {
  const candidate = value as { changed?: unknown };
  return isPlainObject(value) && typeof candidate.changed === 'boolean';
};

const isStatusEntry = (
  value: unknown,
): value is {
  status: 'added' | 'removed' | 'modified' | 'unchanged';
} => {
  const candidate = value as { status?: unknown };
  return (
    isPlainObject(value) &&
    (candidate.status === 'added' ||
      candidate.status === 'removed' ||
      candidate.status === 'modified' ||
      candidate.status === 'unchanged')
  );
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
