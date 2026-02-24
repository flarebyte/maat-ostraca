import { calls } from './calls';
import { type ComponentCall, type FlowContext, incrContext } from './common';

export const cliArgsAnalyse = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'cli.analyse',
    title: 'Parse args for analysing the source code',
    directory: 'cmd/maat',
    note: 'flags: --in filename.go --rules io.calls.count,import.file.list --language go --json',
    level: context.level,
    useCases: [],
  };
  calls.push(call);
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
  semgrepSearch(incrContext(context));
  semgrepSearchCount(incrContext(context));
  calculateMetrics(incrContext(context));
};

export const semgrepSearch = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'semgrep.search',
    title: 'Search content using a pattern using semgrep',
    directory: '',
    note: `semgrep requires login to return lines, but we should be able to extract the lines
    using start/end line/col or possibly offset.
    cat semgrep --lang ts --pattern "appendToReport(...)" --json -
    The approach is slightly hacky and performance may suffer by reading the file multiple times.
    Unclear if there are any gain by passing the filename vs passing the content
    `,
    level: context.level,
    signature: {
      input: '{filename, source, language, pattern}',
      success: '{lines}[]',
    },
    useCases: [],
  };
  calls.push(call);
  runShell(incrContext(context));
};

export const semgrepSearchCount = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'semgrep.search.count',
    title: 'Count patterns using semgrep',
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
  runShell(incrContext(context));
};

export const runShell = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'shell.run',
    title: 'Run a command in shell',
    directory: '',
    note: '',
    level: context.level,
    signature: {
      input: '{command, expectJson}',
      success: '{result}',
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
