import type { AnalyseOutput } from '../../contracts/outputs.js';
import { colorRuleName, colorSection, type HumanFormatStyle } from './color.js';
import { compareStrings, isPlainObject } from './shared.js';

const isHashResult = (
  value: unknown,
): value is { algorithm: string; file?: string } => {
  const candidate = value as { algorithm?: unknown };
  return isPlainObject(value) && typeof candidate.algorithm === 'string';
};

const isMetricsResult = (
  value: unknown,
): value is { loc?: number; tokens?: number } & Record<string, number> => {
  if (!isPlainObject(value)) {
    return false;
  }

  const entries = Object.entries(value);
  if (entries.length === 0) {
    return false;
  }

  return entries.every(([, entry]) => typeof entry === 'number');
};

export const summarizeAnalyseRule = (
  ruleName: string,
  value: unknown,
): string => {
  if (Array.isArray(value)) {
    return `${ruleName}: ${value.length} items`;
  }

  if (isHashResult(value)) {
    return `${ruleName}: ${value.algorithm}`;
  }

  if (ruleName === 'file_metrics' && isMetricsResult(value)) {
    const loc = typeof value.loc === 'number' ? String(value.loc) : undefined;
    const tokens =
      typeof value.tokens === 'number' ? String(value.tokens) : undefined;

    if (loc !== undefined || tokens !== undefined) {
      const parts = [];
      if (loc !== undefined) {
        parts.push(`loc=${loc}`);
      }
      if (tokens !== undefined) {
        parts.push(`tokens=${tokens}`);
      }
      return `${ruleName}: ${parts.join(', ')}`;
    }

    return `${ruleName}: metrics`;
  }

  if (isPlainObject(value) && ruleName.endsWith('_map')) {
    return `${ruleName}: ${Object.keys(value).length} entries`;
  }

  if (isPlainObject(value)) {
    return `${ruleName}: object`;
  }

  return `${ruleName}: value`;
};

export const formatHumanAnalyseSummary = (
  output: AnalyseOutput,
  style: HumanFormatStyle,
): string[] => {
  const ruleNames = Object.keys(output.rules).sort(compareStrings);

  return [
    colorSection('Summary', style),
    ...ruleNames.map(
      (ruleName) =>
        `  ${colorRuleName(ruleName, style)}: ${summarizeAnalyseRule(ruleName, output.rules[ruleName]).slice(ruleName.length + 2)}`,
    ),
  ];
};
