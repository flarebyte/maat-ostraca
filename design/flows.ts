import { calls } from './calls';
import { type ComponentCall, type FlowContext, incrContext } from './common';

export const cliRoot = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'cli.root',
    title: 'MAAT CLI root command',
    directory: 'cmd/maat',
    note: '',
    level: context.level,
    useCases: [],
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
    useCases: [],
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
    useCases: [],
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
    useCases: [],
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
    useCases: [],
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
    useCases: [],
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
    useCases: [],
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
    useCases: [],
  };
  calls.push(call);
};
