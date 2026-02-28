import type { Language } from './types.js';

export interface AnalyseArgs {
  inputPath?: string;
  language: Language;
  rulesCsv: string;
}

export const runAnalyse = async (args: AnalyseArgs): Promise<object> => {
  const filename = args.inputPath;
  return {
    ...(filename ? { filename } : {}),
    language: args.language,
    rules: {},
  };
};
