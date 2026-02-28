import type { RuleName } from '../rules/catalog.js';
import type { Language } from './types.js';

export interface DiffArgs {
  fromFilename: string;
  fromSource: string;
  toFilename?: string;
  toSource: string;
  language: Language;
  rules: readonly RuleName[];
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
  const fromSource = args.fromSource;
  const toSource = args.toSource;
  void fromSource;
  void toSource;
  return {
    from: {
      filename: args.fromFilename,
      language: args.language,
    },
    to: {
      ...(args.toFilename ? { filename: args.toFilename } : {}),
      language: args.language,
    },
    rules: buildRulesObject(args.rules),
    ...(args.deltaOnly ? { deltaOnly: true } : {}),
  };
};
