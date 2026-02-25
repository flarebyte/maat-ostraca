import type { UseCase } from './common.ts';

// Use cases for parsing a single source file (Go, Dart, TypeScript).
export const useCases: Record<string, UseCase> = {
  ioCallsCount: {
    name: 'io.calls.count',
    title: 'Count all I/O calls',
    note: '',
  },
  ioReadCallsCount: {
    name: 'io.read.calls.count',
    title: 'Count all I/O read calls',
    note: '',
  },
  ioWriteCallsCount: {
    name: 'io.write.calls.count',
    title: 'Count all I/O write calls',
    note: '',
  },
  importFileList: {
    name: 'import.files.list',
    title: 'List all imported files',
    note: '',
  },
  importFunctionList: {
    name: 'import.functions.list',
    title: 'List all imported functions',
    note: '',
  },
  importTypeList: {
    name: 'import.types.list',
    title: 'List all imported types',
    note: '',
  },
  packageImportList: {
    name: 'package.imports.list',
    title: 'List all external package imports',
    note: '',
  },
  exceptionMessageList: {
    name: 'exception.messages.list',
    title: 'List all exception messages',
    note: '',
  },
  errorMessageList: {
    name: 'error.messages.list',
    title: 'List all error messages',
    note: '',
  },
  functionSignatureList: {
    name: 'function.signatures.list',
    title: 'List all function signatures',
    note: 'Includes parameter and return signatures.',
  },
  functionMetricsList: {
    name: 'function.metrics.list',
    title: 'List all function metrics',
    note: 'Includes LOC, complexity, tokens, SHA-256 hash, loop count, condition count, and return count.',
  },
  methodSignatureList: {
    name: 'method.signatures.list',
    title: 'List all method signatures',
    note: 'Includes parameter and return signatures.',
  },
  methodMetricsList: {
    name: 'method.metrics.list',
    title: 'List all method metrics',
    note: 'Includes LOC, complexity, tokens, SHA-256 hash, loop count, condition count, and return count.',
  },
  interfaceList: {
    name: 'interfaces.list',
    title: 'List all interfaces',
    note: '',
  },
  classList: {
    name: 'classes.list',
    title: 'List all classes',
    note: '',
  },
  classMetricsList: {
    name: 'class.metrics.list',
    title: 'List all class metrics',
    note: 'Includes LOC, complexity, tokens, SHA-256 hash, and method count.',
  },
  interfaceCodeList: {
    name: 'interfaces.code.list',
    title: 'List code for all interfaces',
    note: '',
  },
  fileMetrics: {
    name: 'file.metrics',
    title: 'List file-level metrics',
    note: 'Includes LOC, complexity, tokens, loop count, and condition count.',
  },
  testCaseTitleList: {
    name: 'testcase.titles.list',
    title: 'List all test case titles',
    note: 'May include unit and end-to-end tests.',
  },
  envNamesList: {
    name: 'env.names.list',
    title: 'List all environment variable names',
    note: '',
  },
  dartSupport: {
    name: 'dart.support',
    title: 'Support semantic parsing of Dart and Flutter files',
    note: '',
  },
  tsSupport: {
    name: 'typescript.support',
    title: 'Support semantic parsing of TypeScript files',
    note: '',
  },
  goSupport: {
    name: 'go.support',
    title: 'Support semantic parsing of Go files',
    note: '',
  },
  predefinedRuleBasedAnalysis: {
    name: 'analysis.rules.predefined',
    title: 'Run predefined rule-based analysis',
    note: 'Output is generated from the selected rules.',
  },
  singleFileAnalysis: {
    name: 'analysis.single.file',
    title: 'Run semantic analysis on a single source file',
    note: 'This reduces implementation scope for v1.',
  },
  aiFriendlyOutput: {
    name: 'output.ai.friendly',
    title: 'Provide AI-friendly output',
    note: 'A `--json` output mode can support this.',
  },
  humanFriendlyOutput: {
    name: 'output.human.friendly',
    title: 'Provide human-friendly output',
    note: 'Use readable formatting, such as colors.',
  },
  outputDeterministicOrder: {
    name: 'output.order.deterministic',
    title: 'Provide deterministic output ordering',
    note: 'Keep field and section ordering stable across runs for the same input.',
  },
  outputSortedValues: {
    name: 'output.values.sorted',
    title: 'Provide sorted list values in output',
    note: 'Sort list-like outputs (for example: imports, names, messages) to keep results predictable.',
  },
  codeHash: {
    name: 'code.hash',
    title: 'SHA-256 hash of code body',
    note: 'Use SHA-256 to hash function or class bodies so code changes are easy to detect.',
  },
  codeComplexity: {
    name: 'code.complexity',
    title: 'Code cyclomatic complexity',
    note: 'The score increases for each branch (for example: if, else, for, while, case).',
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
