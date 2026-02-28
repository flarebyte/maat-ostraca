import { RULE_CATALOG } from '../rules/catalog.js';
import type { RulesListOutput } from './contracts/outputs.js';
import type { Language } from './types.js';

export interface RulesListArgs {
  language: Language;
}

export const runRulesList = async (
  args: RulesListArgs,
): Promise<RulesListOutput> => {
  const rules = RULE_CATALOG.filter((entry) =>
    entry.languages.includes(args.language),
  )
    .map((entry) => ({
      name: entry.name,
      description: entry.description,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    language: args.language,
    rules,
  };
};
