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
  functionMap: {
    name: 'function_map',
    title: 'Map functions by function name',
    note: 'Keyed by function name; each value includes signature details, sorted `modifiers`, metrics, and I/O counts.',
  },
  methodMap: {
    name: 'method_map',
    title: 'Map methods by method key',
    note: 'Keyed by a stable method key (for example: `paymentServiceCharge`); each value includes signature details, sorted `modifiers`, metrics, and I/O counts.',
  },
  interfaceMap: {
    name: 'interface_map',
    title: 'Map interfaces by interface name',
    note: 'Keyed by interface name; each value includes interface metadata (for example: modifiers, extends, method signatures).',
  },
  classMap: {
    name: 'class_map',
    title: 'Map classes by class name',
    note: 'Keyed by class name; each value includes class metadata and metrics (for example: modifiers, inheritance, LOC, SLOC, complexity, tokens, SHA-256 hash, and method count).',
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
  analysisDiffSources: {
    name: 'analysis_diff_sources',
    title: 'Diff analysis between two source snapshots',
    note: 'Compare rule results between a `from` source and a `to` source.',
  },
  analysisEvolutionTracking: {
    name: 'analysis_evolution_tracking',
    title: 'Track code evolution across time or projects',
    note: 'Useful to inspect how a shared file evolves over time or differs between repositories.',
  },
  outputDiffObject: {
    name: 'output_diff_object',
    title: 'Provide structured diff output',
    note: 'Emit a diff object that mirrors analysis shape with `from`, `to`, and `delta` values where relevant.',
  },
  outputDiffDeltaOnly: {
    name: 'output_diff_delta_only',
    title: 'Provide delta-only diff output',
    note: 'When `--delta-only` is set, emit compact diff fields with only deltas (and added/removed markers), without `from`/`to` values.',
  },
  sourceInputStdin: {
    name: 'source_input_stdin',
    title: 'Support source input from stdin',
    note: 'Allow analysis without `--in` by reading source content from standard input.',
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
