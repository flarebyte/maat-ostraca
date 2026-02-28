import type { Language } from './types.js';

export interface DiffArgs {
  fromPath: string;
  toPath?: string;
  language: Language;
  rulesCsv: string;
  deltaOnly?: true;
}

export const runDiff = async (args: DiffArgs): Promise<object> => {
  const toFilename = args.toPath;
  return {
    from: {
      filename: args.fromPath,
      language: args.language,
    },
    to: {
      ...(toFilename ? { filename: toFilename } : {}),
      language: args.language,
    },
    rules: {},
    ...(args.deltaOnly ? { deltaOnly: true } : {}),
  };
};
