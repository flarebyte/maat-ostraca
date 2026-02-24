import type { UseCase } from './common.ts';

// Uses cases when parsing a single source file in go, dart, ts
export const useCases: Record<string, UseCase> = {
  ioCallsCount: {
    name: 'io.calls.count',
    title: 'Count all IO calls',
    note: '',
  },
  ioReadCallsCount: {
    name: 'io.read.calls.count',
    title: 'Count all Read IO calls',
    note: '',
  },
  ioWriteCallsCount: {
    name: 'io.write.calls.count',
    title: 'Count all Write IO calls',
    note: '',
  },
  ImportFileList: {
    name: 'import.file.list',
    title: 'list all imports files',
    note: '',
  },
  ImportFunctionList: {
    name: 'import.function.list',
    title: 'list all imported functions',
    note: '',
  },
  ImportTypeList: {
    name: 'import.type.list',
    title: 'list all imported types',
    note: '',
  },
  packageImportList: {
    name: 'package.import.list',
    title: 'list all import of external packages',
    note: '',
  },
  exceptionListMessage: {
    name: 'exceptions.list.message',
    title: 'list all exceptions messages',
    note: '',
  },
  errorMessageList: {
    name: 'error.message.list',
    title: 'list all error messages',
    note: '',
  },
  functionSignatureList: {
    name: 'function.signature.list',
    title: 'list all functions signatures',
    note: 'Parameters / return signature',
  },
  functionMetricList: {
    name: 'function.metric.list',
    title: 'list all functions metrics',
    note: 'Metrics includes LOC, complexity, tokens, number of loops, number of conditions, number of returns',
  },
  methodSignatureList: {
    name: 'method.signature.list',
    title: 'list all method signatures',
    note: 'Parameters / return signature',
  },
  methodMetricList: {
    name: 'method.metric.list',
    title: 'list all methods metrics',
    note: 'Metrics includes LOC, complexity, tokens, number of loops, number of conditions, number of returns',
  },
  interfaceList: {
    name: 'interface.list',
    title: 'list all interfaces',
    note: '',
  },
  classList: {
    name: 'class.list',
    title: 'list all classes',
    note: '',
  },
  classMetricList: {
    name: 'class.metric.list',
    title: 'list all classes metrics',
    note: 'Metrics includes LOC, complexity, tokens, number of methods',
  },
  interfaceCodeList: {
    name: 'interface.code.list',
    title: 'list the code of all the interfaces',
    note: '',
  },
  fileMetric: {
    name: 'file.metrics',
    title: 'Metrics for the files',
    note: 'Metrics includes LOC, complexity, tokens, number of loops, number of conditions',
  },
  testcaseListTitle: {
    name: 'testcase.list.title',
    title: 'list all test cases titles',
    note: 'testcase may includes unit tests and e2e tests',
  },
  envListName: {
    name: 'env.list.name',
    title: 'list all environment names',
    note: '',
  },
  dartSupport: {
    name: 'dart.support',
    title: 'Support semantic parsing of Dart/Flutter file',
    note: '',
  },
  tsSupport: {
    name: 'typescript.support',
    title: 'Support semantic parsing of Typescript file',
    note: '',
  },
  goSupport: {
    name: 'go.support',
    title: 'Support semantic parsing of go file',
    note: '',
  },
  predifinedRuleBasedAnalysis: {
    name: 'analysis.rule.base',
    title: 'Predefined rules based analysis',
    note: 'Output will be composed based on the selected rules',
  },
  singleFileAnalysis: {
    name: 'analysis.single',
    title: 'Sementic analysis should be performed a single source file',
    note: 'This is the reduce the scope of the implementation for v1',
  },
  aiFriendlyOutput: {
    name: 'output.ai.friendly',
    title: 'Output should be ai friendly',
    note: 'A --json output could achieve this',
  },
  humanFriendlyOutput: {
    name: 'output.human.friendly',
    title: 'Output should be human friendly',
    note: 'Perhhaps some colors',
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
