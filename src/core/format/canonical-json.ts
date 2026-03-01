type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

const sortValue = (value: unknown): JsonValue => {
  if (value === null) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sortValue(item));
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([a], [b]) => a.localeCompare(b),
    );
    const sorted: { [key: string]: JsonValue } = {};
    for (const [key, entryValue] of entries) {
      sorted[key] = sortValue(entryValue);
    }
    return sorted;
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  return String(value);
};

export const canonicalStringify = (value: unknown): string => {
  return JSON.stringify(sortValue(value));
};
