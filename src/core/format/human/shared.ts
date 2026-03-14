const compareStrings = (left: string, right: string): number => {
  return left.localeCompare(right);
};

const sortedEntries = (value: Record<string, unknown>) => {
  return Object.entries(value).sort(([left], [right]) =>
    compareStrings(left, right),
  );
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const formatPrimitive = (value: unknown): string => {
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
  ) {
    return String(value);
  }

  return JSON.stringify(value);
};

export const formatInlineValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => formatInlineValue(entry)).join(', ')}]`;
  }

  if (isPlainObject(value)) {
    return sortedEntries(value)
      .map(([key, entry]) => `${key}=${formatInlineValue(entry)}`)
      .join(', ');
  }

  return formatPrimitive(value);
};

export const appendSection = (
  lines: string[],
  heading: string,
  body: string[],
): void => {
  if (lines.length > 0) {
    lines.push('');
  }

  lines.push(heading);
  lines.push(...body);
};

export const renderStringList = (items: string[]): string[] => {
  if (items.length === 0) {
    return ['(none)'];
  }

  return items.map((item) => `- ${item}`);
};

export const renderObjectLines = (
  value: Record<string, unknown>,
  prefix = '',
): string[] => {
  return sortedEntries(value).map(
    ([key, entry]) => `${prefix}${key}: ${formatInlineValue(entry)}`,
  );
};

export { compareStrings, isPlainObject, sortedEntries };
