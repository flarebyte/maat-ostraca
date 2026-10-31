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
  ['code_hash:swift', () => import('./code_hash/swift.js')],
  ['file_metrics:swift', () => import('./file_metrics/swift.js')],
  ['import_files_list:swift', () => import('./import_files_list/swift.js')],
  [
    'package_imports_list:swift',
    () => import('./package_imports_list/swift.js'),
  ],
  ['function_map:swift', () => import('./function_map/swift.js')],
  ['method_map:swift', () => import('./method_map/swift.js')],
  ['class_map:swift', () => import('./class_map/swift.js')],
  ['interface_map:swift', () => import('./interface_map/swift.js')],
  ['interfaces_code_map:swift', () => import('./interfaces_code_map/swift.js')],
  ['env_names_list:swift', () => import('./env_names_list/swift.js')],
  [
    'exception_messages_list:swift',
    () => import('./exception_messages_list/swift.js'),
  ],
  ['error_messages_list:swift', () => import('./error_messages_list/swift.js')],
  [
    'testcase_titles_list:swift',
    () => import('./testcase_titles_list/swift.js'),
  ],
  ['io_calls_count:swift', () => import('./io_calls_count/swift.js')],
  ['io_read_calls_count:swift', () => import('./io_read_calls_count/swift.js')],
  [
    'io_write_calls_count:swift',
    () => import('./io_write_calls_count/swift.js'),
  ],

  ['code_hash:rust', () => import('./code_hash/rust.js')],
  ['file_metrics:rust', () => import('./file_metrics/rust.js')],
  ['import_files_list:rust', () => import('./import_files_list/rust.js')],
  ['package_imports_list:rust', () => import('./package_imports_list/rust.js')],
  ['function_map:rust', () => import('./function_map/rust.js')],
  ['method_map:rust', () => import('./method_map/rust.js')],
  ['interface_map:rust', () => import('./interface_map/rust.js')],
  ['interfaces_code_map:rust', () => import('./interfaces_code_map/rust.js')],
  ['env_names_list:rust', () => import('./env_names_list/rust.js')],
  [
    'exception_messages_list:rust',
    () => import('./exception_messages_list/rust.js'),
  ],
  ['error_messages_list:rust', () => import('./error_messages_list/rust.js')],
  ['testcase_titles_list:rust', () => import('./testcase_titles_list/rust.js')],
  ['io_calls_count:rust', () => import('./io_calls_count/rust.js')],
  ['io_read_calls_count:rust', () => import('./io_read_calls_count/rust.js')],
  ['io_write_calls_count:rust', () => import('./io_write_calls_count/rust.js')],

  ['class_map:python', () => import('./class_map/python.js')],
  ['env_names_list:python', () => import('./env_names_list/python.js')],
  [
    'exception_messages_list:python',
    () => import('./exception_messages_list/python.js'),
  ],
  [
    'error_messages_list:python',
    () => import('./error_messages_list/python.js'),
  ],
  [
    'testcase_titles_list:python',
    () => import('./testcase_titles_list/python.js'),
  ],
  ['io_calls_count:python', () => import('./io_calls_count/python.js')],
  [
    'io_read_calls_count:python',
    () => import('./io_read_calls_count/python.js'),
  ],
  [
    'io_write_calls_count:python',
    () => import('./io_write_calls_count/python.js'),
  ],

  ['code_hash:python', () => import('./code_hash/python.js')],
  ['file_metrics:python', () => import('./file_metrics/python.js')],
  ['import_files_list:python', () => import('./import_files_list/python.js')],
  [
    'package_imports_list:python',
    () => import('./package_imports_list/python.js'),
  ],
  ['function_map:python', () => import('./function_map/python.js')],
  ['method_map:python', () => import('./method_map/python.js')],

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
  (['typescript', 'go', 'dart', 'python', 'rust', 'swift'] as const).map(
    (language) => [
      language,
      [...ruleLoaders.keys()]
        .filter((key) => key.endsWith(`:${language}`))
        .map((key) => key.slice(0, key.lastIndexOf(':')) as RuleName)
        .sort((left, right) => left.localeCompare(right)),
    ],
  ),
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
