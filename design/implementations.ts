import type { ImplementationConsideration } from './common.ts';

// Initial implementation suggestions. Keep this list small and actionable.
export const implementations: Record<string, ImplementationConsideration> = {
  dependencyPolicy: {
    name: 'deps.policy.minimal.mature',
    title: 'Keep dependencies minimal and choose mature packages',
    description:
      'Default to built-in Node.js modules and add external dependencies only when justified; when needed, prefer mature, widely used, and actively maintained packages.',
    calls: ['cli.analyse', 'rules.resolve', 'rules.dispatch', 'format.output'],
  },
  maintainabilityOverPerfectPerf: {
    name: 'quality.balance.maintainability.performance',
    title: 'Prefer maintainability over perfect performance',
    description:
      'Optimize for clear, maintainable code first; target balanced performance and avoid micro-optimizations that make code hard to read.',
    calls: [
      'rules.resolve',
      'rules.dispatch',
      'metrics.calculate',
      'format.output',
    ],
  },
  fpFirstStyle: {
    name: 'style.fp.first',
    title: 'Prefer functional style before OOP',
    description:
      'Default to small pure functions and explicit data flow; introduce classes/OOP only when stateful boundaries clearly benefit from it.',
    calls: ['rules.resolve', 'rules.dispatch', 'metrics.calculate'],
  },
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
  bunScriptConventions: {
    name: 'scripts.bun.conventions',
    title: 'Use Bun for TypeScript scripts and e2e tests',
    description:
      'Keep e2e tests under `script/e2e` in TypeScript and run them with Bun; keep other operational TypeScript scripts under `script/` (for example: release scripts), also executed with Bun.',
    calls: ['cli.root'],
  },
};
