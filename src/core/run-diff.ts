import type { RuleName } from '../rules/catalog.js';
import type { Language } from './types.js';

export interface DiffArgs {
  fromPath: string;
  toPath?: string;
  language: Language;
  resolvedRules: readonly RuleName[];
  deltaOnly?: true;
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
    rules: buildRulesObject(args.resolvedRules),
    ...(args.deltaOnly ? { deltaOnly: true } : {}),
  };
};
