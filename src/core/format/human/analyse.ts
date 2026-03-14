import type { AnalyseOutput } from '../../contracts/outputs.js';
import {
  appendSection,
  compareStrings,
  formatInlineValue,
  isPlainObject,
  renderObjectLines,
  renderStringList,
  sortedEntries,
} from './shared.js';

const renderRuleValue = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return renderStringList(
      value.map((entry) =>
        typeof entry === 'string' ? entry : formatInlineValue(entry),
      ),
    );
  }

  if (isPlainObject(value)) {
    const entries = sortedEntries(value);
    const allObjectValues = entries.every(([, entry]) => isPlainObject(entry));

    if (allObjectValues) {
      if (entries.length === 0) {
        return ['(none)'];
      }

      return entries.map(
        ([key, entry]) => `${key}: ${formatInlineValue(entry)}`,
      );
    }

    if (entries.length === 0) {
      return ['(none)'];
    }

    return renderObjectLines(value);
  }

  return [formatInlineValue(value)];
};

export const formatHumanAnalyse = (output: AnalyseOutput): string => {
  const lines = [`Language: ${output.language}`];

  if (output.filename) {
    lines.unshift(`File: ${output.filename}`);
  }

  const ruleNames = Object.keys(output.rules).sort(compareStrings);
  for (const ruleName of ruleNames) {
    appendSection(
      lines,
      `[${ruleName}]`,
      renderRuleValue(output.rules[ruleName]),
    );
  }

  return `${lines.join('\n')}\n`;
};
