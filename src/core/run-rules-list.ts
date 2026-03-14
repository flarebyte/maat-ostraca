import { filterRulesManifest } from '../rules/filter_manifest.js';
import type { RulesListOutput } from './contracts/outputs.js';
import type { Language } from './types.js';

export interface RulesListArgs {
  language: Language;
  match?: string;
}

export const runRulesList = async (
  args: RulesListArgs,
): Promise<RulesListOutput> => {
  return {
    language: args.language,
    rules: filterRulesManifest(args),
  };
};
