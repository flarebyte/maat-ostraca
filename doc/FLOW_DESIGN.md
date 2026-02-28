# FLOW DESIGN OVERVIEW (Generated)

## Function calls tree

```
MAAT CLI root command [cli.root]
  - pkg: cmd/maat
  Parse CLI arguments for source code analysis [cli.analyse]
    - note: Flags: --in filename.go --rules io_calls_count,import_files_list --language go --json. If `--in` is omitted, source can be read from stdin. Implemented with commander.js.
    - pkg: cmd/maat
    Resolve requested rules from explicit names and wildcard selectors [rules.resolve]
      - note: Expands `--rules` values such as `import_*` and `io_*` into a deterministic list of concrete rules.
      - input: {rules, language}
      - success: {resolvedRules}[]
    Resolve source input from file path or stdin [source.resolve]
      - note: Reads from `--in` when provided; otherwise reads source from stdin.
      - input: {filename?, stdin, language}
      - success: {filename?, source, language}
    Analyze normalized source content [file.read]
      - note: Consumes source content resolved from file path or stdin.
      - input: {filename?, source, rules, language}
      Analyze all rules [analyse.rules]
        - note: Ideally analyzes rules in parallel.
        - input: {filename, source, rules, language}
        Analyze a single rule [analyse.rule]
          - note: Dispatch to the matching rule analyzer, which may use different hardcoded approaches (for example, ast-grep).
          - input: {filename, source, rulename, language}
          Load and dispatch the rule implementation by rule name and language [rules.dispatch]
            - note: Each rule-language combination should have its own implementation file (for example: `internal/rules/io_calls_count/go.ts`).
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
  Parse CLI arguments for source diff analysis [cli.diff]
    - note: Flags: --from path --to path --rules io_calls_count --language go --json [--delta-only]. `--to` may be omitted to read from stdin.
    - pkg: cmd/maat
    - input: {from, to?, stdin, rules, language, deltaOnly?}
    Resolve requested rules from explicit names and wildcard selectors [rules.resolve]
      - note: Expands `--rules` values such as `import_*` and `io_*` into a deterministic list of concrete rules.
      - input: {rules, language}
      - success: {resolvedRules}[]
    Resolve diff sources from file paths or stdin [source.resolve.diff]
      - note: Reads `from` and `to` sources from files, or reads `to` from stdin when omitted.
      - input: {from, to?, stdin, language}
      - success: {fromSource, toSource, fromFilename, toFilename?, language}
    Analyze source snapshot (`from`) [analyse.snapshot.from]
      - input: {fromFilename, fromSource, rules, language}
      - success: {fromResults}
    Analyze target snapshot (`to`) [analyse.snapshot.to]
      - input: {toFilename?, toSource, rules, language}
      - success: {toResults}
    Build diff object from two analysis snapshots [results.diff]
      - note: Produces a stable diff payload mirroring the analysis structure.
      - input: {fromResults, toResults, deltaOnly?}
      - success: {diff}
    Format output for humans or AI and write to stdout [format.output]
      - input: {results}
  List all available rules and descriptions [cli.rules.list]
    - note: Exposed as a CLI command to discover rules without running analysis.
    - pkg: cmd/maat
    - input: {language}
    - success: {rules: [{name, description}]}
    Load rule catalog and filter by language [rules.catalog.list]
      - note: Returns stable, sorted rule names with human-readable descriptions.
      - pkg: internal/rules
      - input: {language}
      - success: {rules: [{name, description}]}
```

Supported use cases:

  - Run semantic analysis on a single source file — This reduces implementation scope for v1.
  - Support semantic parsing of Go files
  - Support semantic parsing of TypeScript files
  - Support semantic parsing of Dart and Flutter files
  - Support wildcard rule selection in --rules — Allow selectors such as `import_*` and `io_*` to expand to matching rule names.
  - Support source input from stdin — Allow analysis without `--in` by reading source content from standard input.
  - Run predefined rule-based analysis — Output is generated from the selected rules.
  - Dispatch rule execution by rule name and language — Resolve and run the matching implementation using both rule name and source language.
  - Maintain one rule implementation file per rule-language combination — Keep rule logic isolated by rule and language (for example: `rules/io_calls_count/go.ts`).
  - List all imported files
  - List all imported functions
  - List all imported types
  - List all external package imports
  - List all exception messages
  - List all error messages
  - Map functions by function name — Keyed by function name; each value includes signature details, sorted `modifiers`, metrics, and I/O counts.
  - Map methods by method key — Keyed by a stable method key (for example: `paymentServiceCharge`); each value includes signature details, sorted `modifiers`, metrics, and I/O counts.
  - Map interfaces by interface name — Keyed by interface name; each value includes interface metadata (for example: modifiers, extends, method signatures).
  - Map interface code by interface name — Keyed by interface name; each value is the interface code snippet.
  - List all test case titles — May include unit and end-to-end tests.
  - List all environment variable names
  - Count I/O calls per function and method — Returns counts keyed by function and method.
  - Count I/O read calls per function and method — Returns counts keyed by function and method.
  - Count I/O write calls per function and method — Returns counts keyed by function and method.
  - Map classes by class name — Keyed by class name; each value includes class metadata and metrics (for example: modifiers, inheritance, LOC, SLOC, complexity, tokens, SHA-256 hash, and method count).
  - List file-level metrics — Includes LOC, SLOC, cyclomatic complexity, max nesting depth, cognitive complexity, tokens, loop count, and condition count.
  - SHA-256 hash of code body — Use SHA-256 to hash function or class bodies so code changes are easy to detect.
  - Provide AI-friendly output — A `--json` output mode can support this.
  - Provide human-friendly output — Use readable formatting, such as colors.
  - Provide deterministic output ordering — Keep field and section ordering stable across runs for the same input.
  - Provide sorted list values in output — Sort list-like outputs (for example: imports, names, messages) to keep results predictable.
  - Provide map-like outputs for dot-notation access — Prefer object maps over arrays for symbol-based outputs so values can be accessed directly by key.
  - Diff analysis between two source snapshots — Compare rule results between a `from` source and a `to` source.
  - Track code evolution across time or projects — Useful to inspect how a shared file evolves over time or differs between repositories.
  - Provide delta-only diff output — When `--delta-only` is set, emit compact diff fields with only deltas (and added/removed markers), without `from`/`to` values.
  - Provide structured diff output — Emit a diff object that mirrors analysis shape with `from`, `to`, and `delta` values where relevant.
  - List all available rules with descriptions — Expose discoverable rule names and descriptions for the selected language.


Unsupported use cases (yet):

  - Code Halstead metrics — Post-v1 candidate: operator/operand-based measures such as volume, difficulty, and effort.


