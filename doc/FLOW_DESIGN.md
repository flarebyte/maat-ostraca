# FLOW DESIGN OVERVIEW (Generated)

## Function calls tree

```
MAAT CLI root command [cli.root]
  - pkg: cmd/maat
  Parse CLI arguments for source code analysis [cli.analyse]
    - note: Flags: --in filename.go --rules io.calls.count,import.files.list --language go --json. Implemented with commander.js.
    - pkg: cmd/maat
    Read and analyze a source file [file.read]
      - input: {filename, rules, language}
      Analyze a single rule [analyse.rule]
        - note: Dispatch to the matching rule analyzer, which may use different hardcoded approaches (for example, semgrep).
        - input: {filename, source, rulename, language}
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
  - Run predefined rule-based analysis — Output is generated from the selected rules.
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
  - List all function metrics — Includes LOC, complexity, tokens, loop count, condition count, and return count.
  - List all method metrics — Includes LOC, complexity, tokens, loop count, condition count, and return count.
  - List all class metrics — Includes LOC, complexity, tokens, and method count.
  - List file-level metrics — Includes LOC, complexity, tokens, loop count, and condition count.
  - Provide AI-friendly output — A `--json` output mode can support this.
  - Provide human-friendly output — Use readable formatting, such as colors.



## title
  - todo
