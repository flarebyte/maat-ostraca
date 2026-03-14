import type { RulesListOutput } from '../../contracts/outputs.js';
import {
  colorRuleName,
  colorSection,
  createHumanFormatStyle,
  type HumanFormatStyle,
} from './color.js';
import {
  getRuleFamily,
  RULE_FAMILY_ORDER,
  type RuleFamily,
} from './rule_families.js';
import { compareStrings } from './shared.js';

const FAMILY_LABELS: Record<RuleFamily, string> = {
  environment: 'Environment',
  imports: 'Imports',
  io: 'IO',
  messages: 'Messages',
  metrics: 'Metrics',
  symbols: 'Symbols',
  tests: 'Tests',
};

export const formatHumanRules = (
  output: RulesListOutput,
  style: HumanFormatStyle = createHumanFormatStyle(),
): string => {
  const lines = [`Language: ${output.language}`];
  const grouped = new Map<RuleFamily, RulesListOutput['rules']>();

  for (const rule of output.rules) {
    const family = getRuleFamily(rule.name);
    if (!family) {
      continue;
    }

    const current = grouped.get(family) ?? [];
    current.push(rule);
    grouped.set(family, current);
  }

  for (const family of RULE_FAMILY_ORDER) {
    const rules = grouped.get(family);
    if (!rules || rules.length === 0) {
      continue;
    }

    lines.push('');
    lines.push(colorSection(FAMILY_LABELS[family], style));

    for (const rule of [...rules].sort((left, right) =>
      compareStrings(left.name, right.name),
    )) {
      lines.push(`  - ${colorRuleName(rule.name, style)}: ${rule.description}`);
    }
  }

  return `${lines.join('\n')}\n`;
};
