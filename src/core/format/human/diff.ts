import type { DiffOutput } from '../../contracts/outputs.js';
import {
  appendSection,
  compareStrings,
  formatInlineValue,
  isPlainObject,
  sortedEntries,
} from './shared.js';

const isNumericDelta = (
  value: unknown,
): value is { from: number; to: number; delta: number } => {
  return (
    isPlainObject(value) &&
    typeof value.from === 'number' &&
    typeof value.to === 'number' &&
    typeof value.delta === 'number'
  );
};

const isListDiff = (
  value: unknown,
): value is { added: unknown[]; removed: unknown[] } => {
  return (
    isPlainObject(value) &&
    Array.isArray(value.added) &&
    Array.isArray(value.removed)
  );
};

const isHashDiff = (
  value: unknown,
): value is { from?: string; to?: string; changed: boolean } => {
  return isPlainObject(value) && typeof value.changed === 'boolean';
};

const renderListDiff = (value: {
  added: unknown[];
  removed: unknown[];
}): string[] => {
  const lines: string[] = [];

  if (value.added.length > 0) {
    lines.push('Added:');
    for (const item of value.added) {
      lines.push(`+ ${String(item)}`);
    }
  }

  if (value.removed.length > 0) {
    lines.push('Removed:');
    for (const item of value.removed) {
      lines.push(`- ${String(item)}`);
    }
  }

  if (lines.length === 0) {
    return ['(no changes)'];
  }

  return lines;
};

const renderMapDiff = (value: Record<string, unknown>): string[] => {
  if (Object.keys(value).length === 0) {
    return ['(none)'];
  }

  return sortedEntries(value).map(([key, entry]) => {
    if (isPlainObject(entry) && typeof entry.status === 'string') {
      const details = sortedEntries(entry)
        .filter(([field]) => field !== 'status')
        .map(([field, fieldValue]) => {
          if (isNumericDelta(fieldValue)) {
            return `${field}=${fieldValue.from} -> ${fieldValue.to} (delta ${fieldValue.delta})`;
          }

          if (typeof fieldValue === 'number') {
            return `${field}=delta ${fieldValue}`;
          }

          return `${field}=${formatInlineValue(fieldValue)}`;
        });

      const suffix = details.length > 0 ? `, ${details.join(', ')}` : '';
      return `${key}: ${entry.status}${suffix}`;
    }

    return `${key}: ${formatInlineValue(entry)}`;
  });
};

const renderRuleValue = (value: unknown, deltaOnly: boolean): string[] => {
  if (isListDiff(value)) {
    return renderListDiff(value);
  }

  if (isHashDiff(value)) {
    if (typeof value.from === 'string' && typeof value.to === 'string') {
      return [`file: ${value.from} -> ${value.to} (changed ${value.changed})`];
    }

    return [`changed: ${value.changed}`];
  }

  if (isPlainObject(value)) {
    const entries = sortedEntries(value);
    const allNumericDelta = entries.every(([, entry]) => isNumericDelta(entry));
    const allNumbers = entries.every(([, entry]) => typeof entry === 'number');

    if (allNumericDelta) {
      return entries.map(([key, entry]) => {
        const numericEntry = entry as {
          from: number;
          to: number;
          delta: number;
        };
        return `${key}: ${numericEntry.from} -> ${numericEntry.to} (delta ${numericEntry.delta})`;
      });
    }

    if (deltaOnly && allNumbers) {
      return entries.map(([key, entry]) => `${key}: delta ${entry}`);
    }

    return renderMapDiff(value);
  }

  if (typeof value === 'number') {
    return [deltaOnly ? `delta: ${value}` : String(value)];
  }

  return [formatInlineValue(value)];
};

export const formatHumanDiff = (output: DiffOutput): string => {
  const lines = [
    `From: ${output.from.filename}`,
    `To: ${output.to.filename ?? '<stdin>'}`,
    `Language: ${output.from.language}`,
  ];

  if (output.deltaOnly) {
    lines.push('Delta only: true');
  }

  const ruleNames = Object.keys(output.rules).sort(compareStrings);
  for (const ruleName of ruleNames) {
    appendSection(
      lines,
      `[${ruleName}]`,
      renderRuleValue(output.rules[ruleName], Boolean(output.deltaOnly)),
    );
  }

  return `${lines.join('\n')}\n`;
};
