import type { UseCase } from './common.ts';

// Use cases for parsing a single source file (Go, Dart, TypeScript).
export const useCases: Record<string, UseCase> = {
  ioCallsCount: {
    name: 'io_calls_count',
    title: 'Count I/O calls per function and method',
    note: 'Returns counts keyed by function and method.',
  },
  ioReadCallsCount: {
    name: 'io_read_calls_count',
    title: 'Count I/O read calls per function and method',
    note: 'Returns counts keyed by function and method.',
  },
  ioWriteCallsCount: {
    name: 'io_write_calls_count',
    title: 'Count I/O write calls per function and method',
    note: 'Returns counts keyed by function and method.',
  },
  importFileList: {
    name: 'import_files_list',
    title: 'List all imported files',
    note: '',
  },
  importFunctionList: {
    name: 'import_functions_list',
    title: 'List all imported functions',
    note: '',
  },
  importTypeList: {
    name: 'import_types_list',
    title: 'List all imported types',
    note: '',
  },
  packageImportList: {
    name: 'package_imports_list',
    title: 'List all external package imports',
    note: '',
  },
  exceptionMessageList: {
    name: 'exception_messages_list',
    title: 'List all exception messages',
    note: '',
  },
  errorMessageList: {
    name: 'error_messages_list',
    title: 'List all error messages',
    note: '',
  },
  functionSignaturesMap: {
    name: 'function_signatures_map',
    title: 'Map function signatures by function name',
    note: 'Keyed by function name; each value includes parameter/return signatures and sorted `modifiers`.',
  },
  functionMetricsMap: {
    name: 'function_metrics_map',
    title: 'Map function metrics by function name',
    note: 'Keyed by function name; each value includes LOC, SLOC, cyclomatic complexity, max nesting depth, cognitive complexity, tokens, SHA-256 hash, loop count, condition count, and return count.',
  },
  methodSignaturesMap: {
    name: 'method_signatures_map',
    title: 'Map method signatures by method key',
    note: 'Keyed by a stable method key (for example: `paymentServiceCharge`); each value includes parameter/return signatures and sorted `modifiers`.',
  },
  methodMetricsMap: {
    name: 'method_metrics_map',
    title: 'Map method metrics by method key',
    note: 'Keyed by a stable method key (for example: `paymentServiceCharge`); each value includes LOC, SLOC, cyclomatic complexity, max nesting depth, cognitive complexity, tokens, SHA-256 hash, loop count, condition count, and return count.',
  },
  interfaceList: {
    name: 'interfaces_list',
    title: 'List all interfaces',
    note: '',
  },
  classList: {
    name: 'classes_list',
    title: 'List all classes',
    note: '',
  },
  classMetricsMap: {
    name: 'class_metrics_map',
    title: 'Map class metrics by class name',
    note: 'Keyed by class name; each value includes LOC, SLOC, cyclomatic complexity, max nesting depth, cognitive complexity, tokens, SHA-256 hash, and method count.',
  },
  interfacesCodeMap: {
    name: 'interfaces_code_map',
    title: 'Map interface code by interface name',
    note: 'Keyed by interface name; each value is the interface code snippet.',
  },
  fileMetrics: {
    name: 'file_metrics',
    title: 'List file-level metrics',
    note: 'Includes LOC, SLOC, cyclomatic complexity, max nesting depth, cognitive complexity, tokens, loop count, and condition count.',
  },
  testCaseTitleList: {
    name: 'testcase_titles_list',
    title: 'List all test case titles',
    note: 'May include unit and end-to-end tests.',
  },
  envNamesList: {
    name: 'env_names_list',
    title: 'List all environment variable names',
    note: '',
  },
  dartSupport: {
    name: 'dart_support',
    title: 'Support semantic parsing of Dart and Flutter files',
    note: '',
  },
  tsSupport: {
    name: 'typescript_support',
    title: 'Support semantic parsing of TypeScript files',
    note: '',
  },
  goSupport: {
    name: 'go_support',
    title: 'Support semantic parsing of Go files',
    note: '',
  },
  predefinedRuleBasedAnalysis: {
    name: 'analysis_rules_predefined',
    title: 'Run predefined rule-based analysis',
    note: 'Output is generated from the selected rules.',
  },
  rulesWildcardSelection: {
    name: 'rules_selection_wildcard',
    title: 'Support wildcard rule selection in --rules',
    note: 'Allow selectors such as `import_*` and `io_*` to expand to matching rule names.',
  },
  rulesDispatchByNameAndLanguage: {
    name: 'rules_dispatch_by_name_language',
    title: 'Dispatch rule execution by rule name and language',
    note: 'Resolve and run the matching implementation using both rule name and source language.',
  },
  rulesImplementationPerLanguageFile: {
    name: 'rules_implementation_per_language_file',
    title:
      'Maintain one rule implementation file per rule-language combination',
    note: 'Keep rule logic isolated by rule and language (for example: `rules/io_calls_count/go.ts`).',
  },
  rulesListAvailable: {
    name: 'rules_list_available',
    title: 'List all available rules with descriptions',
    note: 'Expose discoverable rule names and descriptions for the selected language.',
  },
  singleFileAnalysis: {
    name: 'analysis_single_file',
    title: 'Run semantic analysis on a single source file',
    note: 'This reduces implementation scope for v1.',
  },
  aiFriendlyOutput: {
    name: 'output_ai_friendly',
    title: 'Provide AI-friendly output',
    note: 'A `--json` output mode can support this.',
  },
  humanFriendlyOutput: {
    name: 'output_human_friendly',
    title: 'Provide human-friendly output',
    note: 'Use readable formatting, such as colors.',
  },
  outputDeterministicOrder: {
    name: 'output_order_deterministic',
    title: 'Provide deterministic output ordering',
    note: 'Keep field and section ordering stable across runs for the same input.',
  },
  outputSortedValues: {
    name: 'output_values_sorted',
    title: 'Provide sorted list values in output',
    note: 'Sort list-like outputs (for example: imports, names, messages) to keep results predictable.',
  },
  outputDotNotationAccess: {
    name: 'output_access_dot_notation',
    title: 'Provide map-like outputs for dot-notation access',
    note: 'Prefer object maps over arrays for symbol-based outputs so values can be accessed directly by key.',
  },
  codeHash: {
    name: 'code_hash',
    title: 'SHA-256 hash of code body',
    note: 'Use SHA-256 to hash function or class bodies so code changes are easy to detect.',
  },
  codeComplexity: {
    name: 'code_complexity',
    title: 'Code cyclomatic complexity',
    note: 'The score increases for each branch (for example: if, else, for, while, case).',
  },
  codeSloc: {
    name: 'code_sloc',
    title: 'Source lines of code (SLOC)',
    note: 'Count non-blank, non-comment source lines in the analyzed scope.',
  },
  codeNestingDepthMax: {
    name: 'code_nesting_depth_max',
    title: 'Maximum nesting depth',
    note: 'Measures the deepest control-flow nesting level in the analyzed scope.',
  },
  codeCognitiveComplexity: {
    name: 'code_cognitive_complexity',
    title: 'Code cognitive complexity',
    note: 'Estimates how difficult the control flow is for humans to understand.',
  },
  codeHalsteadMetrics: {
    name: 'code_halstead_metrics',
    title: 'Code Halstead metrics',
    note: 'Post-v1 candidate: operator/operand-based measures such as volume, difficulty, and effort.',
  },
};

export const getByName = (expectedName: string) =>
  Object.values(useCases).find(({ name }) => name === expectedName);

export const mustUseCases = new Set([
  ...Object.values(useCases).map(({ name }) => name),
]);

export const useCaseCatalogByName: Record<
  string,
  { name: string; title: string; note?: string }
> = Object.fromEntries(Object.values(useCases).map((u) => [u.name, u]));
