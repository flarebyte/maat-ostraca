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
  cliDiff(incrContext(context));
  cliRulesList(incrContext(context));
};

export const cliArgsAnalyse = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'cli.analyse',
    title: 'Parse CLI arguments for source code analysis',
    directory: 'cmd/maat',
    note: 'Flags: --in filename.go --rules io_calls_count,import_files_list --language go --json. If `--in` is omitted, source can be read from stdin. Implemented with commander.js.',
    level: context.level,
    useCases: [
      useCases.goSupport.name,
      useCases.tsSupport.name,
      useCases.dartSupport.name,
      useCases.rulesWildcardSelection.name,
      useCases.sourceInputStdin.name,
    ],
  };
  calls.push(call);
  resolveRequestedRules(incrContext(context));
  resolveSourceInput(incrContext(context));
  analyseSourceContent(incrContext(context));
  formatOutput(incrContext(context));
};

export const resolveSourceInput = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'source.resolve',
    title: 'Resolve source input from file path or stdin',
    directory: '',
    note: 'Reads from `--in` when provided; otherwise reads source from stdin.',
    level: context.level,
    signature: {
      input: '{filename?, stdin, language}',
      success: '{filename?, source, language}',
    },
    useCases: [useCases.sourceInputStdin.name],
  };
  calls.push(call);
};

export const cliRulesList = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'cli.rules.list',
    title: 'List all available rules and descriptions',
    directory: 'cmd/maat',
    note: 'Exposed as a CLI command to discover rules without running analysis.',
    level: context.level,
    signature: {
      input: '{language}',
      success: '{rules: [{name, description}]}',
    },
    useCases: [useCases.rulesListAvailable.name],
  };
  calls.push(call);
  listRulesCatalog(incrContext(context));
};

export const cliDiff = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'cli.diff',
    title: 'Parse CLI arguments for source diff analysis',
    directory: 'cmd/maat',
    note: 'Flags: --from path --to path --rules io_calls_count --language go --json. `--to` may be omitted to read from stdin.',
    level: context.level,
    signature: {
      input: '{from, to?, stdin, rules, language}',
    },
    useCases: [
      useCases.analysisDiffSources.name,
      useCases.analysisEvolutionTracking.name,
      useCases.sourceInputStdin.name,
      useCases.rulesWildcardSelection.name,
    ],
  };
  calls.push(call);
  resolveRequestedRules(incrContext(context));
  resolveDiffSourceInputs(incrContext(context));
  analyseSourceSnapshot(incrContext(context));
  analyseTargetSnapshot(incrContext(context));
  diffAnalysisResults(incrContext(context));
  formatOutput(incrContext(context));
};

export const resolveDiffSourceInputs = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'source.resolve.diff',
    title: 'Resolve diff sources from file paths or stdin',
    directory: '',
    note: 'Reads `from` and `to` sources from files, or reads `to` from stdin when omitted.',
    level: context.level,
    signature: {
      input: '{from, to?, stdin, language}',
      success: '{fromSource, toSource, fromFilename, toFilename?, language}',
    },
    useCases: [
      useCases.sourceInputStdin.name,
      useCases.analysisDiffSources.name,
    ],
  };
  calls.push(call);
};

export const analyseSourceSnapshot = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'analyse.snapshot.from',
    title: 'Analyze source snapshot (`from`)',
    directory: '',
    note: '',
    level: context.level,
    signature: {
      input: '{fromFilename, fromSource, rules, language}',
      success: '{fromResults}',
    },
    useCases: [
      useCases.analysisDiffSources.name,
      useCases.predefinedRuleBasedAnalysis.name,
    ],
  };
  calls.push(call);
};

export const analyseTargetSnapshot = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'analyse.snapshot.to',
    title: 'Analyze target snapshot (`to`)',
    directory: '',
    note: '',
    level: context.level,
    signature: {
      input: '{toFilename?, toSource, rules, language}',
      success: '{toResults}',
    },
    useCases: [
      useCases.analysisDiffSources.name,
      useCases.predefinedRuleBasedAnalysis.name,
    ],
  };
  calls.push(call);
};

export const diffAnalysisResults = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'results.diff',
    title: 'Build diff object from two analysis snapshots',
    directory: '',
    note: 'Produces a stable diff payload mirroring the analysis structure.',
    level: context.level,
    signature: {
      input: '{fromResults, toResults}',
      success: '{diff}',
    },
    useCases: [
      useCases.analysisDiffSources.name,
      useCases.analysisEvolutionTracking.name,
      useCases.outputDiffObject.name,
      useCases.outputDeterministicOrder.name,
    ],
  };
  calls.push(call);
};

export const listRulesCatalog = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'rules.catalog.list',
    title: 'Load rule catalog and filter by language',
    directory: 'internal/rules',
    note: 'Returns stable, sorted rule names with human-readable descriptions.',
    level: context.level,
    signature: {
      input: '{language}',
      success: '{rules: [{name, description}]}',
    },
    useCases: [
      useCases.rulesListAvailable.name,
      useCases.outputDeterministicOrder.name,
      useCases.outputSortedValues.name,
    ],
  };
  calls.push(call);
};

export const resolveRequestedRules = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'rules.resolve',
    title: 'Resolve requested rules from explicit names and wildcard selectors',
    directory: '',
    note: 'Expands `--rules` values such as `import_*` and `io_*` into a deterministic list of concrete rules.',
    level: context.level,
    signature: {
      input: '{rules, language}',
      success: '{resolvedRules}[]',
    },
    useCases: [useCases.rulesWildcardSelection.name],
  };
  calls.push(call);
};

export const analyseSourceContent = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'file.read',
    title: 'Analyze normalized source content',
    directory: '',
    note: 'Consumes source content resolved from file path or stdin.',
    level: context.level,
    signature: {
      input: '{filename?, source, rules, language}',
    },
    useCases: [
      useCases.singleFileAnalysis.name,
      useCases.sourceInputStdin.name,
    ],
  };
  calls.push(call);
  analyseAllRules(incrContext(context));
};

export const analyseSingleRule = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'analyse.rule',
    title: 'Analyze a single rule',
    directory: '',
    note: 'Dispatch to the matching rule analyzer, which may use different hardcoded approaches (for example, ast-grep).',
    level: context.level,
    signature: {
      input: '{filename, source, rulename, language}',
    },
    useCases: [useCases.predefinedRuleBasedAnalysis.name],
  };
  calls.push(call);
  dispatchRuleImplementation(incrContext(context));
};

export const analyseAllRules = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'analyse.rules',
    title: 'Analyze all rules',
    directory: '',
    note: 'Ideally analyzes rules in parallel.',
    level: context.level,
    signature: {
      input: '{filename, source, rules, language}',
    },
    useCases: [useCases.predefinedRuleBasedAnalysis.name],
  };
  calls.push(call);
  analyseSingleRule(incrContext(context));
};

export const dispatchRuleImplementation = (context: FlowContext) => {
  const call: ComponentCall = {
    name: 'rules.dispatch',
    title:
      'Load and dispatch the rule implementation by rule name and language',
    directory: 'internal/rules',
    note: 'Each rule-language combination should have its own implementation file (for example: `internal/rules/io_calls_count/go.ts`).',
    level: context.level,
    signature: {
      input: '{ruleName, language, filename, source}',
    },
    useCases: [
      useCases.rulesDispatchByNameAndLanguage.name,
      useCases.rulesImplementationPerLanguageFile.name,
    ],
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
      useCases.functionMap.name,
      useCases.methodMap.name,
      useCases.interfaceMap.name,
      useCases.interfacesCodeMap.name,
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
      useCases.functionMap.name,
      useCases.methodMap.name,
      useCases.classMap.name,
      useCases.fileMetrics.name,
      useCases.codeHash.name,
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
      useCases.outputDeterministicOrder.name,
      useCases.outputSortedValues.name,
      useCases.outputDotNotationAccess.name,
    ],
  };
  calls.push(call);
};
