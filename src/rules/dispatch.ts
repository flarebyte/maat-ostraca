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
  ['import_files_list:go', () => import('./import_files_list/go.js')],
  [
    'import_files_list:typescript',
    () => import('./import_files_list/typescript.js'),
  ],
  [
    'package_imports_list:typescript',
    () => import('./package_imports_list/typescript.js'),
  ],
  ['package_imports_list:go', () => import('./package_imports_list/go.js')],
  [
    'error_messages_list:typescript',
    () => import('./error_messages_list/typescript.js'),
  ],
  [
    'exception_messages_list:typescript',
    () => import('./exception_messages_list/typescript.js'),
  ],
  ['env_names_list:typescript', () => import('./env_names_list/typescript.js')],
  [
    'testcase_titles_list:typescript',
    () => import('./testcase_titles_list/typescript.js'),
  ],
  ['function_map:typescript', () => import('./function_map/typescript.js')],
  ['function_map:go', () => import('./function_map/go.js')],
  ['method_map:typescript', () => import('./method_map/typescript.js')],
  ['method_map:go', () => import('./method_map/go.js')],
  ['class_map:typescript', () => import('./class_map/typescript.js')],
  ['interface_map:typescript', () => import('./interface_map/typescript.js')],
  ['interface_map:go', () => import('./interface_map/go.js')],
  [
    'interfaces_code_map:typescript',
    () => import('./interfaces_code_map/typescript.js'),
  ],
  ['interfaces_code_map:go', () => import('./interfaces_code_map/go.js')],
  ['io_calls_count:go', () => import('./io_calls_count/go.js')],
  ['io_calls_count:typescript', () => import('./io_calls_count/typescript.js')],
  ['io_read_calls_count:go', () => import('./io_read_calls_count/go.js')],
  [
    'io_read_calls_count:typescript',
    () => import('./io_read_calls_count/typescript.js'),
  ],
  ['io_write_calls_count:go', () => import('./io_write_calls_count/go.js')],
  [
    'io_write_calls_count:typescript',
    () => import('./io_write_calls_count/typescript.js'),
  ],
  ['file_metrics:go', () => import('./file_metrics/go.js')],
  ['file_metrics:typescript', () => import('./file_metrics/typescript.js')],
  ['code_hash:go', () => import('./code_hash/go.js')],
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
