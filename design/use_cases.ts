import type { UseCase } from './common.ts';

// Uses cases when parsing a single source file in go, dart, ts
export const useCases: Record<string, UseCase> = {
  ioCallsCount: {
    name: 'io.calls.count',
    title: 'Count all IO calls',
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
    note: '',
  },
  functionMetricList: {
    name: 'function.metric.list',
    title: 'list all functions metrics',
    note: 'Metrics includes LOC, complexity, tokens',
  },
  methodSignatureList: {
    name: 'method.signature.list',
    title: 'list all method signatures',
    note: '',
  },
  methodMetricList: {
    name: 'method.metric.list',
    title: 'list all methods metrics',
    note: 'Metrics includes LOC, complexity, tokens',
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
    note: 'Metrics includes LOC, complexity, tokens',
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
  fileRefPathList: {
    name: 'fileref.list.path',
    title: 'list all file paths refs',
    note: '',
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
