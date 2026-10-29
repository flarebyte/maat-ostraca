const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isListDiff = (
  value: unknown,
): value is { added: unknown[]; removed: unknown[] } => {
  const candidate = value as { added?: unknown; removed?: unknown };
  return (
    isPlainObject(value) &&
    Array.isArray(candidate.added) &&
    Array.isArray(candidate.removed)
  );
};

export const isHashDiff = (
  value: unknown,
): value is { from?: string; to?: string; changed: boolean } => {
  const candidate = value as { changed?: unknown };
  return isPlainObject(value) && typeof candidate.changed === 'boolean';
};

export const isNumericDelta = (
  value: unknown,
): value is { from: number; to: number; delta: number } => {
  const candidate = value as { from?: unknown; to?: unknown; delta?: unknown };
  return (
    isPlainObject(value) &&
    typeof candidate.from === 'number' &&
    typeof candidate.to === 'number' &&
    typeof candidate.delta === 'number'
  );
};

export const isStatusEntry = (
  value: unknown,
): value is { status: 'added' | 'removed' | 'modified' | 'unchanged' } => {
  const candidate = value as { status?: unknown };
  return (
    isPlainObject(value) &&
    (candidate.status === 'added' ||
      candidate.status === 'removed' ||
      candidate.status === 'modified' ||
      candidate.status === 'unchanged')
  );
};
