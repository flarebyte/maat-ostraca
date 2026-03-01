import type { RuleName } from '../../rules/catalog.js';

export type RuleKind = 'map' | 'list' | 'metrics' | 'hash' | 'counter';

const MAP_RULES: readonly RuleName[] = [
  'function_map',
  'method_map',
  'class_map',
  'interface_map',
  'interfaces_code_map',
] as const;

const LIST_RULES: readonly RuleName[] = [
  'import_files_list',
  'import_functions_list',
  'import_types_list',
  'package_imports_list',
  'exception_messages_list',
  'error_messages_list',
  'env_names_list',
  'testcase_titles_list',
] as const;

const METRICS_RULES: readonly RuleName[] = ['file_metrics'] as const;

const HASH_RULES: readonly RuleName[] = ['code_hash'] as const;

const COUNTER_RULES: readonly RuleName[] = [
  'io_calls_count',
  'io_read_calls_count',
  'io_write_calls_count',
] as const;

const ruleKindMap = new Map<RuleName, RuleKind>();

for (const name of MAP_RULES) {
  ruleKindMap.set(name, 'map');
}

for (const name of LIST_RULES) {
  ruleKindMap.set(name, 'list');
}

for (const name of METRICS_RULES) {
  ruleKindMap.set(name, 'metrics');
}

for (const name of HASH_RULES) {
  ruleKindMap.set(name, 'hash');
}

for (const name of COUNTER_RULES) {
  ruleKindMap.set(name, 'counter');
}

export const getRuleKind = (name: RuleName): RuleKind => {
  return ruleKindMap.get(name) ?? 'map';
};
