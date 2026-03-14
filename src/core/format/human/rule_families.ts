import type { RuleName } from '../../../rules/catalog.js';

export const RULE_FAMILY_ORDER = [
  'imports',
  'symbols',
  'metrics',
  'io',
  'messages',
  'environment',
  'tests',
] as const;

export type RuleFamily = (typeof RULE_FAMILY_ORDER)[number];

const RULE_FAMILY_ENTRIES: ReadonlyArray<readonly [RuleName, RuleFamily]> = [
  ['import_files_list', 'imports'],
  ['import_functions_list', 'imports'],
  ['import_types_list', 'imports'],
  ['package_imports_list', 'imports'],
  ['function_map', 'symbols'],
  ['method_map', 'symbols'],
  ['class_map', 'symbols'],
  ['interface_map', 'symbols'],
  ['interfaces_code_map', 'symbols'],
  ['file_metrics', 'metrics'],
  ['code_hash', 'metrics'],
  ['io_calls_count', 'io'],
  ['io_read_calls_count', 'io'],
  ['io_write_calls_count', 'io'],
  ['error_messages_list', 'messages'],
  ['exception_messages_list', 'messages'],
  ['env_names_list', 'environment'],
  ['testcase_titles_list', 'tests'],
] as const;

const RULE_FAMILY_MAP = new Map<RuleName, RuleFamily>(RULE_FAMILY_ENTRIES);

export const getRuleFamily = (ruleName: RuleName): RuleFamily | undefined => {
  return RULE_FAMILY_MAP.get(ruleName);
};
