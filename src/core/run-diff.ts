import type { RuleName } from '../rules/catalog.js';
import type { DiffOutput } from './contracts/outputs.js';
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
): Record<string, unknown> => {
  const map: Record<string, unknown> = {};
  for (const rule of rules) {
    map[rule] = null;
  }
  return map;
};

export const runDiff = async (args: DiffArgs): Promise<DiffOutput> => {
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
