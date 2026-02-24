import { calls } from './calls';
import { type ComponentCall, type FlowContext, incrContext } from './common';
import { useCases } from './use_cases.ts';

export const cliRoot = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'cli.root',
    title: 'MAAT CLI root command',
    directory: 'cmd/maat',
    note: '',
    level: context.level,
    useCases: [useCases.singleFileAnalysis.name],
  };
  calls.push(call);
  // Register commands under the root.
  cliArgsAnalyse(incrContext(context));
};

export const cliArgsAnalyse = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'cli.analyse',
    title: 'Parse CLI arguments for source code analysis',
    directory: 'cmd/maat',
    note: 'Flags: --in filename.go --rules io.calls.count,import.files.list --language go --json. Implemented with commander.js.',
    level: context.level,
    useCases: [
      useCases.goSupport.name,
      useCases.tsSupport.name,
      useCases.dartSupport.name,
    ],
  };
  calls.push(call);
  analyseSourceContent(incrContext(context));
  formatOutput(incrContext(context));
};

export const analyseSourceContent = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'file.read',
    title: 'Read and analyze a source file',
    directory: '',
    note: '',
    level: context.level,
    signature: {
      input: '{filename, rules, language}',
    },
    useCases: [useCases.singleFileAnalysis.name],
  };
  calls.push(call);
  analyseRule(incrContext(context));
};

export const analyseRule = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'analyse.rule',
    title: 'Analyze a single rule',
    directory: '',
    note: 'Dispatch to the matching rule analyzer, which may use different hardcoded approaches (for example, semgrep).',
    level: context.level,
    signature: {
      input: '{filename, source, rulename, language}',
    },
    useCases: [useCases.predefinedRuleBasedAnalysis.name],
  };
  calls.push(call);
  astgrepSearch(incrContext(context));
  astgrepSearchCount(incrContext(context));
  calculateMetrics(incrContext(context));
};

export const astgrepSearch = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'astgrep.search',
    title: 'Search source content with an ast-grep pattern',
    directory: '',
    note: '',
    level: context.level,
    signature: {
      input: '{filename, source, language, pattern}',
      success: '{lines}[]',
    },
    useCases: [
      useCases.importFileList.name,
      useCases.importFunctionList.name,
      useCases.importTypeList.name,
      useCases.packageImportList.name,
      useCases.exceptionMessageList.name,
      useCases.errorMessageList.name,
      useCases.functionSignatureList.name,
      useCases.methodSignatureList.name,
      useCases.interfaceList.name,
      useCases.classList.name,
      useCases.interfaceCodeList.name,
      useCases.testCaseTitleList.name,
      useCases.envNamesList.name,
    ],
  };
  calls.push(call);
};

export const astgrepSearchCount = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'astgrep.search.count',
    title: 'Count pattern matches with ast-grep',
    directory: '',
    note: '',
    level: context.level,
    signature: {
      input: '{filename, source, language, pattern}',
      success: '{count}[]',
    },
    useCases: [
      useCases.ioCallsCount.name,
      useCases.ioReadCallsCount.name,
      useCases.ioWriteCallsCount.name,
    ],
  };
  calls.push(call);
};

export const calculateMetrics = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'metrics.calculate',
    title: 'Calculate code metrics',
    directory: '',
    note: '',
    level: context.level,
    signature: {
      input: '{filename, source, language, metrics}',
      success: '{loc, tokens}',
    },
    useCases: [
      useCases.functionMetricsList.name,
      useCases.methodMetricsList.name,
      useCases.classMetricsList.name,
      useCases.fileMetrics.name,
    ],
  };
  calls.push(call);
};

export const formatOutput = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'format.output',
    title: 'Format output for humans or AI and write to stdout',
    directory: '',
    note: '',
    level: context.level,
    signature: {
      input: '{results}',
    },
    useCases: [
      useCases.aiFriendlyOutput.name,
      useCases.humanFriendlyOutput.name,
    ],
  };
  calls.push(call);
};
