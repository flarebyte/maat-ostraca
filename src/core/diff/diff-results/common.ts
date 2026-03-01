export type RuleValue = unknown;

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value);
};

export const deepEqual = (a: unknown, b: unknown): boolean => {
  return JSON.stringify(a) === JSON.stringify(b);
};

export const sortedKeys = (value: Record<string, unknown>): string[] => {
  return Object.keys(value).sort((a, b) => a.localeCompare(b));
};

export const isNil = (value: unknown): boolean => {
  return value === null || value === undefined;
};
