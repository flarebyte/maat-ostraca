# FLOW DESIGN OVERVIEW (Generated)

## Function calls tree

```
MAAT CLI root command [cli.root]
  - pkg: cmd/maat
  Parse CLI arguments for source code analysis [cli.analyse]
    - note: Flags: --in filename.go --rules io.calls.count,import.files.list --language go --json. Implemented with commander.js.
    - pkg: cmd/maat
    Resolve requested rules from explicit names and wildcard selectors [rules.resolve]
      - note: Expands `--rules` values such as `import.*` and `io.*` into a deterministic list of concrete rules.
      - input: {rules, language}
      - success: {resolvedRules}[]
    Read and analyze a source file [file.read]
      - input: {filename, rules, language}
      Analyze all rules [analyse.rules]
        - note: Ideally analyzes rules in parallel.
        - input: {filename, source, rules, language}
        Analyze a single rule [analyse.rule]
          - note: Dispatch to the matching rule analyzer, which may use different hardcoded approaches (for example, ast-grep).
          - input: {filename, source, rulename, language}
          Load and dispatch the rule implementation by rule name and language [rules.dispatch]
            - note: Each rule-language combination should have its own implementation file (for example: `internal/rules/io.calls.count/go.ts`).
            - pkg: internal/rules
            - input: {ruleName, language, filename, source}
            Search source content with an ast-grep pattern [astgrep.search]
              - input: {filename, source, language, pattern}
              - success: {lines}[]
            Count pattern matches with ast-grep [astgrep.search.count]
              - input: {filename, source, language, pattern}
              - success: {count}[]
            Calculate code metrics [metrics.calculate]
              - input: {filename, source, language, metrics}
              - success: {loc, tokens}
    Format output for humans or AI and write to stdout [format.output]
      - input: {results}
```

Supported use cases:

  - Run semantic analysis on a single source file — This reduces implementation scope for v1.
  - Support semantic parsing of Go files
  - Support semantic parsing of TypeScript files
  - Support semantic parsing of Dart and Flutter files
  - Support wildcard rule selection in --rules — Allow selectors such as `import.*` and `io.*` to expand to matching rule names.
  - Run predefined rule-based analysis — Output is generated from the selected rules.
  - Dispatch rule execution by rule name and language — Resolve and run the matching implementation using both rule name and source language.
  - Maintain one rule implementation file per rule-language combination — Keep rule logic isolated by rule and language (for example: `rules/io.calls.count/go.ts`).
  - List all imported files
  - List all imported functions
  - List all imported types
  - List all external package imports
  - List all exception messages
  - List all error messages
  - List all function signatures — Includes parameter and return signatures.
  - List all method signatures — Includes parameter and return signatures.
  - List all interfaces
  - List all classes
  - List code for all interfaces
  - List all test case titles — May include unit and end-to-end tests.
  - List all environment variable names
  - Count all I/O calls
  - Count all I/O read calls
  - Count all I/O write calls
  - List all function metrics — Includes LOC, complexity, tokens, SHA-256 hash, loop count, condition count, and return count.
  - List all method metrics — Includes LOC, complexity, tokens, SHA-256 hash, loop count, condition count, and return count.
  - List all class metrics — Includes LOC, complexity, tokens, SHA-256 hash, and method count.
  - List file-level metrics — Includes LOC, complexity, tokens, loop count, and condition count.
  - SHA-256 hash of code body — Use SHA-256 to hash function or class bodies so code changes are easy to detect.
  - Code cyclomatic complexity — The score increases for each branch (for example: if, else, for, while, case).
  - Provide AI-friendly output — A `--json` output mode can support this.
  - Provide human-friendly output — Use readable formatting, such as colors.
  - Provide deterministic output ordering — Keep field and section ordering stable across runs for the same input.
  - Provide sorted list values in output — Sort list-like outputs (for example: imports, names, messages) to keep results predictable.



## title
  - todo
