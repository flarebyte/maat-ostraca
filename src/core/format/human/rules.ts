import type { RulesListOutput } from '../../contracts/outputs.js';

export const formatHumanRules = (output: RulesListOutput): string => {
  const lines = [`Language: ${output.language}`, 'Rules:'];

  for (const rule of [...output.rules].sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    lines.push(`- ${rule.name}: ${rule.description}`);
  }

  return `${lines.join('\n')}\n`;
};
