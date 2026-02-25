import type { ImplementationConsideration } from './common.ts';

// Initial implementation suggestions. Keep this list small and actionable.
export const implementations: Record<string, ImplementationConsideration> = {
  nodeRuntime: {
    name: 'runtime.nodejs',
    title: 'Use Node.js as the CLI runtime',
    description:
      'Implement the CLI in TypeScript on Node.js to keep a strong ecosystem fit for tooling, packaging, and process orchestration.',
    calls: ['cli.root', 'cli.analyse', 'format.output'],
  },
  commanderArgParsing: {
    name: 'cli.args.commander',
    title: 'Use commander.js for CLI argument parsing',
    description:
      'Use commander.js for flag parsing, help text, defaults, and validation for options such as --in, --rules, --language, and --json.',
    calls: ['cli.analyse', 'rules.resolve'],
  },
  astGrepEngine: {
    name: 'analysis.engine.ast-grep',
    title: 'Use ast-grep as the primary semantic pattern engine',
    description:
      'Use ast-grep for language-aware pattern matching so rule implementations can stay concise and consistent across languages.',
    calls: ['rules.dispatch', 'astgrep.search', 'astgrep.search.count'],
  },
  ruleModulesByLanguage: {
    name: 'rules.modules.by.language',
    title: 'Implement one module per rule-language combination',
    description:
      'Keep implementations isolated by rule and language (for example: internal/rules/io.calls.count/go.ts) to simplify dispatch and maintenance.',
    calls: ['rules.dispatch'],
  },
};
