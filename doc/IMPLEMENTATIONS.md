# Implementation Considerations (Generated)

This document summarizes suggested implementation choices.

## Summary
- Use ast-grep as the primary semantic pattern engine [analysis.engine.ast-grep]
- Use commander.js for CLI argument parsing [cli.args.commander]
- Implement one module per rule-language combination [rules.modules.by.language]
- Use Node.js as the CLI runtime [runtime.nodejs]

## Use ast-grep as the primary semantic pattern engine [analysis.engine.ast-grep]

- Description: Use ast-grep for language-aware pattern matching so rule implementations can stay concise and consistent across languages.
- Calls: rules.dispatch, astgrep.search, astgrep.search.count

## Use commander.js for CLI argument parsing [cli.args.commander]

- Description: Use commander.js for flag parsing, help text, defaults, and validation for options such as --in, --rules, --language, and --json.
- Calls: cli.analyse, rules.resolve

## Implement one module per rule-language combination [rules.modules.by.language]

- Description: Keep implementations isolated by rule and language (for example: internal/rules/io.calls.count/go.ts) to simplify dispatch and maintenance.
- Calls: rules.dispatch

## Use Node.js as the CLI runtime [runtime.nodejs]

- Description: Implement the CLI in TypeScript on Node.js to keep a strong ecosystem fit for tooling, packaging, and process orchestration.
- Calls: cli.root, cli.analyse, format.output
