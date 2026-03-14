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
  ['import_files_list:dart', () => import('./import_files_list/dart.js')],
  ['import_files_list:go', () => import('./import_files_list/go.js')],
  [
    'import_files_list:typescript',
    () => import('./import_files_list/typescript.js'),
  ],
  ['package_imports_list:dart', () => import('./package_imports_list/dart.js')],
  [
    'package_imports_list:typescript',
    () => import('./package_imports_list/typescript.js'),
  ],
  ['package_imports_list:go', () => import('./package_imports_list/go.js')],
  [
    'error_messages_list:typescript',
    () => import('./error_messages_list/typescript.js'),
  ],
  ['error_messages_list:dart', () => import('./error_messages_list/dart.js')],
  ['error_messages_list:go', () => import('./error_messages_list/go.js')],
  [
    'exception_messages_list:dart',
    () => import('./exception_messages_list/dart.js'),
  ],
  [
    'exception_messages_list:typescript',
    () => import('./exception_messages_list/typescript.js'),
  ],
  [
    'exception_messages_list:go',
    () => import('./exception_messages_list/go.js'),
  ],
  ['env_names_list:typescript', () => import('./env_names_list/typescript.js')],
  ['env_names_list:dart', () => import('./env_names_list/dart.js')],
  ['env_names_list:go', () => import('./env_names_list/go.js')],
  [
    'testcase_titles_list:typescript',
    () => import('./testcase_titles_list/typescript.js'),
  ],
  ['testcase_titles_list:dart', () => import('./testcase_titles_list/dart.js')],
  ['testcase_titles_list:go', () => import('./testcase_titles_list/go.js')],
  ['function_map:dart', () => import('./function_map/dart.js')],
  ['function_map:typescript', () => import('./function_map/typescript.js')],
  ['function_map:go', () => import('./function_map/go.js')],
  ['method_map:dart', () => import('./method_map/dart.js')],
  ['method_map:typescript', () => import('./method_map/typescript.js')],
  ['method_map:go', () => import('./method_map/go.js')],
  ['class_map:dart', () => import('./class_map/dart.js')],
  ['class_map:typescript', () => import('./class_map/typescript.js')],
  ['interface_map:dart', () => import('./interface_map/dart.js')],
  ['interface_map:typescript', () => import('./interface_map/typescript.js')],
  ['interface_map:go', () => import('./interface_map/go.js')],
  ['interfaces_code_map:dart', () => import('./interfaces_code_map/dart.js')],
  [
    'interfaces_code_map:typescript',
    () => import('./interfaces_code_map/typescript.js'),
  ],
  ['interfaces_code_map:go', () => import('./interfaces_code_map/go.js')],
  ['io_calls_count:go', () => import('./io_calls_count/go.js')],
  ['io_calls_count:dart', () => import('./io_calls_count/dart.js')],
  ['io_calls_count:typescript', () => import('./io_calls_count/typescript.js')],
  ['io_read_calls_count:go', () => import('./io_read_calls_count/go.js')],
  ['io_read_calls_count:dart', () => import('./io_read_calls_count/dart.js')],
  [
    'io_read_calls_count:typescript',
    () => import('./io_read_calls_count/typescript.js'),
  ],
  ['io_write_calls_count:go', () => import('./io_write_calls_count/go.js')],
  ['io_write_calls_count:dart', () => import('./io_write_calls_count/dart.js')],
  [
    'io_write_calls_count:typescript',
    () => import('./io_write_calls_count/typescript.js'),
  ],
  ['file_metrics:dart', () => import('./file_metrics/dart.js')],
  ['file_metrics:go', () => import('./file_metrics/go.js')],
  ['file_metrics:typescript', () => import('./file_metrics/typescript.js')],
  ['code_hash:dart', () => import('./code_hash/dart.js')],
  ['code_hash:go', () => import('./code_hash/go.js')],
  ['code_hash:typescript', () => import('./code_hash/typescript.js')],
]);

export const IMPLEMENTED_RULES_BY_LANGUAGE = new Map<Language, RuleName[]>(
  (['typescript', 'go', 'dart'] as const).map((language) => [
    language,
    [...ruleLoaders.keys()]
      .filter((key) => key.endsWith(`:${language}`))
      .map((key) => key.slice(0, key.lastIndexOf(':')) as RuleName)
      .sort((left, right) => left.localeCompare(right)),
  ]),
);

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
