import type { DiffOutput } from '../../contracts/outputs.js';
import {
  colorDelta,
  colorDiffStatus,
  colorRuleName,
  colorSection,
  createHumanFormatStyle,
  type HumanFormatStyle,
} from './color.js';
import { formatHumanDiffSummary } from './diff_summary.js';
import {
  appendSection,
  compareStrings,
  formatInlineValue,
  indentLines,
  isPlainObject,
  sortedEntries,
} from './shared.js';
import { summarizeListLines, summarizeMapLines } from './summary.js';

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

const isHashDiff = (
  value: unknown,
): value is { from?: string; to?: string; changed: boolean } => {
  const candidate = value as Record<string, unknown>;
  return isPlainObject(value) && typeof candidate.changed === 'boolean';
};

const formatDeltaValue = (delta: number, style: HumanFormatStyle): string => {
  const text = delta > 0 ? `+${delta}` : String(delta);
  return colorDelta(text, style);
};

const renderDiffListSection = (
  heading: 'Added' | 'Removed',
  symbol: '+' | '-',
  items: unknown[],
  style: HumanFormatStyle,
): string[] => {
  if (items.length === 0) {
    return [];
  }

  return summarizeListLines(
    items.map(
      (item) => `${heading}: ${colorDelta(symbol, style)} ${String(item)}`,
    ),
    `${heading.toLowerCase()} items`,
  );
};

const renderListDiff = (
  value: { added: unknown[]; removed: unknown[] },
  style: HumanFormatStyle,
): string[] => {
  const lines = [
    ...renderDiffListSection('Added', '+', value.added, style),
    ...renderDiffListSection('Removed', '-', value.removed, style),
  ];

  if (lines.length === 0) {
    return ['(no changes)'];
  }

  return lines;
};

const renderMapDiff = (
  value: Record<string, unknown>,
  style: HumanFormatStyle,
): string[] => {
  if (Object.keys(value).length === 0) {
    return indentLines(['(none)']);
  }

  return indentLines(
    summarizeMapLines(
      sortedEntries(value).map(([key, entry]) => {
        const candidate = entry as Record<string, unknown>;
        if (isPlainObject(entry) && typeof candidate.status === 'string') {
          const details = sortedEntries(entry)
            .filter(([field]) => field !== 'status')
            .map(([field, fieldValue]) => {
              if (isNumericDelta(fieldValue)) {
                return `${field}=${fieldValue.from} -> ${fieldValue.to} (delta ${formatDeltaValue(fieldValue.delta, style)})`;
              }

              if (typeof fieldValue === 'number') {
                return `${field}=delta ${formatDeltaValue(fieldValue, style)}`;
              }

              return `${field}=${formatInlineValue(fieldValue)}`;
            });

          const suffix = details.length > 0 ? `, ${details.join(', ')}` : '';
          return `${key}: ${colorDiffStatus(String(candidate.status), style)}${suffix}`;
        }

        return `${key}: ${formatInlineValue(entry)}`;
      }),
    ),
  );
};

const renderRuleValue = (
  value: unknown,
  deltaOnly: boolean,
  style: HumanFormatStyle,
): string[] => {
  if (isListDiff(value)) {
    return indentLines(renderListDiff(value, style));
  }

  if (isHashDiff(value)) {
    if (typeof value.from === 'string' && typeof value.to === 'string') {
      return indentLines([
        `file: ${value.from} -> ${value.to} (changed ${value.changed})`,
      ]);
    }

    return indentLines([`changed: ${value.changed}`]);
  }

  if (isPlainObject(value)) {
    const entries = sortedEntries(value);
    const allNumericDelta = entries.every(([, entry]) => isNumericDelta(entry));
    const allNumbers = entries.every(([, entry]) => typeof entry === 'number');

    if (allNumericDelta) {
      return indentLines(
        summarizeMapLines(
          entries.map(([key, entry]) => {
            const numericEntry = entry as {
              from: number;
              to: number;
              delta: number;
            };
            return `${key}: ${numericEntry.from} -> ${numericEntry.to} (delta ${formatDeltaValue(numericEntry.delta, style)})`;
          }),
        ),
      );
    }

    if (deltaOnly && allNumbers) {
      return indentLines(
        summarizeMapLines(
          entries.map(
            ([key, entry]) =>
              `${key}: delta ${formatDeltaValue(entry as number, style)}`,
          ),
        ),
      );
    }

    return renderMapDiff(value, style);
  }

  if (typeof value === 'number') {
    return indentLines([
      deltaOnly ? `delta: ${formatDeltaValue(value, style)}` : String(value),
    ]);
  }

  return indentLines([formatInlineValue(value)]);
};

export const formatHumanDiff = (
  output: DiffOutput,
  style: HumanFormatStyle = createHumanFormatStyle(),
): string => {
  const lines = [
    `From: ${output.from.filename}`,
    `To: ${output.to.filename ?? '<stdin>'}`,
    `Language: ${output.from.language}`,
  ];

  if (output.deltaOnly) {
    lines.push('Delta only: true');
  }

  lines.push(...['', ...formatHumanDiffSummary(output, style)]);

  const ruleNames = Object.keys(output.rules).sort(compareStrings);
  for (const ruleName of ruleNames) {
    appendSection(
      lines,
      colorSection(`[${colorRuleName(ruleName, style)}]`, style),
      renderRuleValue(output.rules[ruleName], Boolean(output.deltaOnly), style),
    );
  }

  return `${lines.join('\n')}\n`;
};
