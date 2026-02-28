import type { RuleName } from '../rules/catalog.js';
import type { AnalyseOutput } from './contracts/outputs.js';
import type { Language } from './types.js';

export interface AnalyseArgs {
  filename?: string;
  source: string;
  language: Language;
  rules: readonly RuleName[];
}

const buildRulesObject = (
  rules: readonly RuleName[],
): Record<string, unknown> => {
  const map: Record<string, unknown> = {};
  for (const rule of rules) {
    map[rule] = null;
  }
  return map;
};

export const runAnalyse = async (args: AnalyseArgs): Promise<AnalyseOutput> => {
  const source = args.source;
  void source;

  return {
    ...(args.filename ? { filename: args.filename } : {}),
    language: args.language,
    rules: buildRulesObject(args.rules),
  };
};
