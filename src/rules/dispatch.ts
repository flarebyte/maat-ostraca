import type { Language } from '../core/contracts/language.js';
import { InternalError, UsageError } from '../core/errors/index.js';
import type { RuleName } from './catalog.js';

export interface RuleRunInput {
  filename?: string;
  source: string;
  language: Language;
}

export type RuleRunner = (input: RuleRunInput) => Promise<unknown>;

interface RuleModule {
  run: RuleRunner;
}

const ruleLoaders = new Map<string, () => Promise<RuleModule>>([
  [
    'import_files_list:typescript',
    () => import('./import_files_list/typescript.js'),
  ],
  ['file_metrics:typescript', () => import('./file_metrics/typescript.js')],
  ['code_hash:typescript', () => import('./code_hash/typescript.js')],
]);

export const dispatchRule = async (
  ruleName: RuleName,
  language: Language,
): Promise<RuleRunner> => {
  const key = `${ruleName}:${language}`;
  const load = ruleLoaders.get(key);

  if (!load) {
    throw new UsageError(
      `rule "${ruleName}" is not implemented for language "${language}"`,
    );
  }

  try {
    const mod = await load();

    if (typeof mod.run !== 'function') {
      throw new InternalError(
        `dispatch_error: missing run export for rule "${ruleName}" and language "${language}"`,
      );
    }

    return mod.run;
  } catch (error: unknown) {
    if (error instanceof UsageError || error instanceof InternalError) {
      throw error;
    }

    throw new InternalError(
      `dispatch_error: failed to load rule "${ruleName}" for language "${language}"`,
    );
  }
};
