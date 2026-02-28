import type { RuleName } from '../rules/catalog.js';
import type { Language } from './types.js';

export interface AnalyseArgs {
  filename?: string;
  source: string;
  language: Language;
  rules: readonly RuleName[];
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
  const filename = args.filename;
  const source = args.source;
  void source;
  return {
    ...(filename ? { filename } : {}),
    language: args.language,
    rules: buildRulesObject(args.rules),
  };
};
