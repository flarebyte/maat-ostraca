import type { Language } from './types.js';

export interface RulesListArgs {
  language: Language;
}

export const runRulesList = async (args: RulesListArgs): Promise<object> => {
  return {
    language: args.language,
    rules: [],
  };
};
