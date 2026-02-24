import { calls } from './calls';
import { type ComponentCall, type FlowContext, incrContext } from './common';

export const cliRoot = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'cli.root',
    title: 'maat CLI root command',
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
    title: 'Parse args for analysing the source code',
    directory: 'cmd/maat',
    note: 'flags: --in filename.go --rules io.calls.count,import.files.list --language go --json. Uses of commander.js',
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
    title: 'Read the content of source file and analyse the source file',
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
    title: 'Analyse a single rule',
    directory: '',
    note: 'Dispatch to right rule analyser than may use different hardcoded approach (ex: semgrep, ...)',
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
    title: 'Search content using a pattern using astgrep',
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
    title: 'Count patterns using astgrep',
    directory: '',
    note: ``,
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
    title: 'Format output for human or ai to stdout',
    directory: '',
    note: ``,
    level: context.level,
    signature: {
      input: '{results}',
    },
    useCases: [],
  };
  calls.push(call);
};
