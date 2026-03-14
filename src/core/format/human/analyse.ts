import type { AnalyseOutput } from '../../contracts/outputs.js';
import {
  colorRuleName,
  colorSection,
  createHumanFormatStyle,
  type HumanFormatStyle,
} from './color.js';
import {
  appendSection,
  compareStrings,
  formatInlineValue,
  indentLines,
  isPlainObject,
  renderObjectLines,
  renderStringList,
  sortedEntries,
} from './shared.js';

const renderRuleValue = (value: unknown, style: HumanFormatStyle): string[] => {
  if (Array.isArray(value)) {
    return indentLines(
      renderStringList(
        value.map((entry) =>
          typeof entry === 'string' ? entry : formatInlineValue(entry),
        ),
        style,
      ),
    );
  }

  if (isPlainObject(value)) {
    const entries = sortedEntries(value);
    const allObjectValues = entries.every(([, entry]) => isPlainObject(entry));

    if (allObjectValues) {
      if (entries.length === 0) {
        return indentLines(['(none)']);
      }

      return indentLines(
        entries.map(([key, entry]) => `${key}: ${formatInlineValue(entry)}`),
      );
    }

    if (entries.length === 0) {
      return indentLines(['(none)']);
    }

    return indentLines(renderObjectLines(value));
  }

  return indentLines([formatInlineValue(value)]);
};

export const formatHumanAnalyse = (
  output: AnalyseOutput,
  style: HumanFormatStyle = createHumanFormatStyle(),
): string => {
  const lines = [`Language: ${output.language}`];

  if (output.filename) {
    lines.unshift(`File: ${output.filename}`);
  }

  const ruleNames = Object.keys(output.rules).sort(compareStrings);
  for (const ruleName of ruleNames) {
    appendSection(
      lines,
      colorSection(`[${colorRuleName(ruleName, style)}]`, style),
      renderRuleValue(output.rules[ruleName], style),
    );
  }

  return `${lines.join('\n')}\n`;
};
