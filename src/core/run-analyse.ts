import type { RuleName } from '../rules/catalog.js';
import type { Language } from './types.js';

export interface AnalyseArgs {
  inputPath?: string;
  language: Language;
  resolvedRules: readonly RuleName[];
}

const buildRulesObject = (
  rules: readonly RuleName[],
): Record<RuleName, null> => {
  const map = {} as Record<RuleName, null>;
  for (const rule of rules) {
    map[rule] = null;
  }
  return map;
};

export const runAnalyse = async (args: AnalyseArgs): Promise<object> => {
  const filename = args.inputPath;
  return {
    ...(filename ? { filename } : {}),
    language: args.language,
    rules: buildRulesObject(args.resolvedRules),
  };
};
