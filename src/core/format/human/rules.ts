import type { RulesListOutput } from '../../contracts/outputs.js';
import {
  colorRuleName,
  createHumanFormatStyle,
  type HumanFormatStyle,
} from './color.js';
import { summarizeListLines } from './summary.js';

export const formatHumanRules = (
  output: RulesListOutput,
  style: HumanFormatStyle = createHumanFormatStyle(),
): string => {
  const lines = [`Language: ${output.language}`, 'Rules:'];
  const renderedRules = [...output.rules]
    .sort((left, right) => left.name.localeCompare(right.name))
    .map(
      (rule) => `  - ${colorRuleName(rule.name, style)}: ${rule.description}`,
    );

  for (const line of summarizeListLines(renderedRules, 'rules')) {
    lines.push(line);
  }

  return `${lines.join('\n')}\n`;
};
