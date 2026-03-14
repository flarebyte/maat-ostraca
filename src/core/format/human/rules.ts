import type { RulesListOutput } from '../../contracts/outputs.js';
import {
  colorRuleName,
  createHumanFormatStyle,
  type HumanFormatStyle,
} from './color.js';

export const formatHumanRules = (
  output: RulesListOutput,
  style: HumanFormatStyle = createHumanFormatStyle(),
): string => {
  const lines = [`Language: ${output.language}`, 'Rules:'];

  for (const rule of [...output.rules].sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    lines.push(`  - ${colorRuleName(rule.name, style)}: ${rule.description}`);
  }

  return `${lines.join('\n')}\n`;
};
