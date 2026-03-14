import type { Language } from '../core/types.js';

export const RULE_NAMES = [
  'import_files_list',
  'import_functions_list',
  'import_types_list',
  'package_imports_list',
  'exception_messages_list',
  'error_messages_list',
  'env_names_list',
  'testcase_titles_list',
  'function_map',
  'method_map',
  'class_map',
  'interface_map',
  'interfaces_code_map',
  'file_metrics',
  'code_hash',
  'io_calls_count',
  'io_read_calls_count',
  'io_write_calls_count',
] as const;

export type RuleName = (typeof RULE_NAMES)[number];

export interface RuleCatalogEntry {
  name: RuleName;
  description: string;
  languages: Language[];
}

export const RULE_CATALOG: readonly RuleCatalogEntry[] = [
  {
    name: 'import_files_list',
    description: 'List imported files by module path.',
    languages: ['go', 'typescript', 'dart'],
  },
  {
    name: 'import_functions_list',
    description: 'List imported function identifiers.',
    languages: ['go', 'typescript', 'dart'],
  },
  {
    name: 'import_types_list',
    description: 'List imported type identifiers.',
    languages: ['go', 'typescript', 'dart'],
  },
  {
    name: 'package_imports_list',
    description: 'List package-level import statements.',
    languages: ['go', 'typescript', 'dart'],
  },
  {
    name: 'exception_messages_list',
    description: 'List thrown exception message literals.',
    languages: ['go', 'typescript', 'dart'],
  },
  {
    name: 'error_messages_list',
    description: 'List returned or logged error message literals.',
    languages: ['go', 'typescript', 'dart'],
  },
  {
    name: 'env_names_list',
    description: 'List environment variable names accessed by code.',
    languages: ['go', 'typescript', 'dart'],
  },
  {
    name: 'testcase_titles_list',
    description: 'List detected test case titles.',
    languages: ['go', 'typescript', 'dart'],
  },
  {
    name: 'function_map',
    description: 'Map function declarations and signatures.',
    languages: ['go', 'typescript', 'dart'],
  },
  {
    name: 'method_map',
    description: 'Map method declarations and receivers/classes.',
    languages: ['go', 'typescript', 'dart'],
  },
  {
    name: 'class_map',
    description: 'Map class declarations and members.',
    languages: ['typescript', 'dart'],
  },
  {
    name: 'interface_map',
    description: 'Map interface declarations and members.',
    languages: ['go', 'typescript', 'dart'],
  },
  {
    name: 'interfaces_code_map',
    description: 'Map interfaces to canonical source snippets.',
    languages: ['go', 'typescript', 'dart'],
  },
  {
    name: 'file_metrics',
    description: 'Collect basic per-file metric counters.',
    languages: ['go', 'typescript', 'dart'],
  },
  {
    name: 'code_hash',
    description: 'Compute deterministic code-level content hash.',
    languages: ['go', 'typescript', 'dart'],
  },
  {
    name: 'io_calls_count',
    description: 'Count all IO-related call sites.',
    languages: ['go', 'typescript', 'dart'],
  },
  {
    name: 'io_read_calls_count',
    description: 'Count IO read call sites.',
    languages: ['go', 'typescript', 'dart'],
  },
  {
    name: 'io_write_calls_count',
    description: 'Count IO write call sites.',
    languages: ['go', 'typescript', 'dart'],
  },
] as const;
