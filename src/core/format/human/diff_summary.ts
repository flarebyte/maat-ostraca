import type { DiffOutput } from '../../contracts/outputs.js';
import { colorRuleName, colorSection, type HumanFormatStyle } from './color.js';
import { compareStrings, isPlainObject, sortedEntries } from './shared.js';

const isListDiff = (
  value: unknown,
): value is { added: unknown[]; removed: unknown[] } => {
  const candidate = value as Record<string, unknown>;
  return (
    isPlainObject(value) &&
    Array.isArray(candidate.added) &&
    Array.isArray(candidate.removed)
  );
};

const isHashDiff = (value: unknown): value is { changed: boolean } => {
  const candidate = value as Record<string, unknown>;
  return isPlainObject(value) && typeof candidate.changed === 'boolean';
};

const isNumericDelta = (
  value: unknown,
): value is { from: number; to: number; delta: number } => {
  const candidate = value as Record<string, unknown>;
  return (
    isPlainObject(value) &&
    typeof candidate.from === 'number' &&
    typeof candidate.to === 'number' &&
    typeof candidate.delta === 'number'
  );
};

const isStatusEntry = (
  value: unknown,
): value is { status: 'added' | 'removed' | 'modified' | 'unchanged' } => {
  const candidate = value as Record<string, unknown>;
  return (
    isPlainObject(value) &&
    (candidate.status === 'added' ||
      candidate.status === 'removed' ||
      candidate.status === 'modified' ||
      candidate.status === 'unchanged')
  );
};

const summarizeMetricsRule = (
  ruleName: string,
  value: Record<string, unknown>,
) => {
  const entries = sortedEntries(value);
  const allNumericDelta = entries.every(([, entry]) => isNumericDelta(entry));
  const allNumbers = entries.every(([, entry]) => typeof entry === 'number');

  if (allNumericDelta) {
    const count = entries.filter(([, entry]) => {
      const delta = (entry as { delta: number }).delta;
      return delta !== 0;
    }).length;
    return `${ruleName}: ${count} metric changes`;
  }

  if (allNumbers) {
    const count = entries.filter(([, entry]) => (entry as number) !== 0).length;
    return `${ruleName}: ${count} metric changes`;
  }

  return null;
};

const summarizeMapRule = (ruleName: string, value: Record<string, unknown>) => {
  const entries = sortedEntries(value);
  if (entries.length === 0) {
    return `${ruleName}: changed`;
  }

  if (!entries.every(([, entry]) => isStatusEntry(entry))) {
    return `${ruleName}: changed`;
  }

  const counts = new Map<string, number>();
  for (const [, entry] of entries) {
    const status = (entry as { status: string }).status;
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }

  const parts = ['added', 'removed', 'modified', 'unchanged']
    .filter((status) => counts.has(status))
    .map((status) => `${counts.get(status)} ${status}`);

  return parts.length > 0
    ? `${ruleName}: ${parts.join(', ')}`
    : `${ruleName}: changed`;
};

export const summarizeDiffRule = (ruleName: string, value: unknown): string => {
  if (isListDiff(value)) {
    return `${ruleName}: +${value.added.length} / -${value.removed.length}`;
  }

  if (isHashDiff(value)) {
    return `${ruleName}: ${value.changed ? 'changed' : 'unchanged'}`;
  }

  if (isPlainObject(value)) {
    const metricsSummary = summarizeMetricsRule(ruleName, value);
    if (metricsSummary !== null) {
      return metricsSummary;
    }

    return summarizeMapRule(ruleName, value);
  }

  return `${ruleName}: changed`;
};

export const formatHumanDiffSummary = (
  output: DiffOutput,
  style: HumanFormatStyle,
): string[] => {
  const ruleNames = Object.keys(output.rules).sort(compareStrings);
  if (ruleNames.length === 0) {
    return [];
  }

  return [
    colorSection('Summary', style),
    ...ruleNames.map(
      (ruleName) =>
        `  ${colorRuleName(ruleName, style)}: ${summarizeDiffRule(ruleName, output.rules[ruleName]).slice(ruleName.length + 2)}`,
    ),
  ];
};
