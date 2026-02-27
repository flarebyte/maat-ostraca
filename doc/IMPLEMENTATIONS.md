# Implementation Considerations (Generated)

This document summarizes suggested implementation choices.

## Summary
- Use ast-grep as the primary semantic pattern engine [analysis.engine.ast-grep]
- Use commander.js for CLI argument parsing [cli.args.commander]
- Keep dependencies minimal and choose mature packages [deps.policy.minimal.mature]
- Adopt modern TypeScript/JavaScript syntax quickly [lang.tsjs.modern.syntax]
- Prefer maintainability over perfect performance [quality.balance.maintainability.performance]
- Implement one module per rule-language combination [rules.modules.by.language]
- Use underscore as the rule-name separator [rules.name.separator.underscore]
- Target latest Node.js LTS and keep dependencies up to date [runtime.node.lts.latest]
- Use Node.js as the CLI runtime [runtime.nodejs]
- Use Bun for TypeScript scripts and e2e tests [scripts.bun.conventions]
- Prefer functional style before OOP [style.fp.first]

## Use ast-grep as the primary semantic pattern engine [analysis.engine.ast-grep]

- Description: Use ast-grep for language-aware pattern matching so rule implementations can stay concise and consistent across languages.
- Calls: rules.dispatch, astgrep.search, astgrep.search.count

## Use commander.js for CLI argument parsing [cli.args.commander]

- Description: Use commander.js for flag parsing, help text, defaults, and validation for options such as --in, --rules, --language, and --json.
- Calls: cli.analyse, rules.resolve

## Keep dependencies minimal and choose mature packages [deps.policy.minimal.mature]

- Description: Default to built-in Node.js modules and add external dependencies only when justified; when needed, prefer mature, widely used, and actively maintained packages.
- Calls: cli.analyse, rules.resolve, rules.dispatch, format.output

## Adopt modern TypeScript/JavaScript syntax quickly [lang.tsjs.modern.syntax]

- Description: Use modern TS/JS syntax and recommendations by default, unless a newer construct has a measurable negative performance impact in a hot path.
- Calls: cli.root, rules.resolve, rules.dispatch, metrics.calculate

## Prefer maintainability over perfect performance [quality.balance.maintainability.performance]

- Description: Optimize for clear, maintainable code first; target balanced performance and avoid micro-optimizations that make code hard to read.
- Calls: rules.resolve, rules.dispatch, metrics.calculate, format.output

## Implement one module per rule-language combination [rules.modules.by.language]

- Description: Keep implementations isolated by rule and language (for example: internal/rules/io_calls_count/go.ts) to simplify dispatch and maintenance.
- Calls: rules.dispatch

## Use underscore as the rule-name separator [rules.name.separator.underscore]

- Description: Use `_` in rule names (for example: `function_map`) instead of `.` to avoid escaping in tools such as jq and JavaScript property access.
- Calls: cli.analyse, rules.resolve, rules.catalog.list, format.output

## Target latest Node.js LTS and keep dependencies up to date [runtime.node.lts.latest]

- Description: Run on the latest Node.js LTS and keep dependencies current with regular updates to benefit from security fixes, compatibility improvements, and ecosystem recommendations.
- Calls: cli.root, cli.analyse, rules.resolve, format.output

## Use Node.js as the CLI runtime [runtime.nodejs]

- Description: Implement the CLI in TypeScript on Node.js to keep a strong ecosystem fit for tooling, packaging, and process orchestration.
- Calls: cli.root, cli.analyse, format.output

## Use Bun for TypeScript scripts and e2e tests [scripts.bun.conventions]

- Description: Keep e2e tests under `script/e2e` in TypeScript and run them with Bun; keep other operational TypeScript scripts under `script/` (for example: release scripts), also executed with Bun.
- Calls: cli.root

## Prefer functional style before OOP [style.fp.first]

- Description: Default to small pure functions and explicit data flow; introduce classes/OOP only when stateful boundaries clearly benefit from it.
- Calls: rules.resolve, rules.dispatch, metrics.calculate
