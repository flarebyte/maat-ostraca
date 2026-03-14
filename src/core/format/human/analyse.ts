import type { AnalyseOutput } from '../../contracts/outputs.js';
import { formatHumanAnalyseSummary } from './analyse_summary.js';
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
import { summarizeListLines, summarizeMapLines } from './summary.js';

const renderRuleValue = (value: unknown, style: HumanFormatStyle): string[] => {
  if (Array.isArray(value)) {
    return indentLines(
      summarizeListLines(
        renderStringList(
          value.map((entry) =>
            typeof entry === 'string' ? entry : formatInlineValue(entry),
          ),
          style,
        ),
        'items',
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
        summarizeMapLines(
          entries.map(([key, entry]) => `${key}: ${formatInlineValue(entry)}`),
        ),
      );
    }

    if (entries.length === 0) {
      return indentLines(['(none)']);
    }

    return indentLines(summarizeMapLines(renderObjectLines(value)));
  }

  return indentLines([formatInlineValue(value)]);
};

export const formatHumanAnalyse = (
  output: AnalyseOutput,
  style: HumanFormatStyle = createHumanFormatStyle(),
): string => {
  const lines = [
    `Language: ${output.language}`,
    `Rules: ${Object.keys(output.rules).length}`,
  ];

  if (output.filename) {
    lines.unshift(`File: ${output.filename}`);
  }

  lines.push('', ...formatHumanAnalyseSummary(output, style));

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
