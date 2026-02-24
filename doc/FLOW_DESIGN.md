# FLOW DESIGN OVERVIEW (Generated)

## Function calls tree

```
maat CLI root command [cli.root]
  - pkg: cmd/maat
  Parse args for analysing the source code [cli.analyse]
    - note: flags: --in filename.go --rules io.calls.count,import.files.list --language go --json. Uses of commander.js
    - pkg: cmd/maat
    Read the content of source file and analyse the source file [file.read]
      - input: {filename, rules, language}
      Analyse a single rule [analyse.rule]
        - note: Dispatch to right rule analyser than may use different hardcoded approach (ex: semgrep, ...)
        - input: {filename, source, rulename, language}
        Search content using a pattern using astgrep [astgrep.search]
          - input: {filename, source, language, pattern}
          - success: {lines}[]
        Count patterns using astgrep [astgrep.search.count]
          - input: {filename, source, language, pattern}
          - success: {count}[]
        Calculate code metrics [metrics.calculate]
          - input: {filename, source, language, metrics}
          - success: {loc, tokens}
    Format output for human or ai to stdout [format.output]
      - input: {results}
```

Supported use cases:




Unsupported use cases (yet):

  - Count all I/O calls
  - Count all I/O read calls
  - Count all I/O write calls
  - List all imported files
  - List all imported functions
  - List all imported types
  - List all external package imports
  - List all exception messages
  - List all error messages
  - List all function signatures — Includes parameter and return signatures.
  - List all function metrics — Includes LOC, complexity, tokens, loop count, condition count, and return count.
  - List all method signatures — Includes parameter and return signatures.
  - List all method metrics — Includes LOC, complexity, tokens, loop count, condition count, and return count.
  - List all interfaces
  - List all classes
  - List all class metrics — Includes LOC, complexity, tokens, and method count.
  - List code for all interfaces
  - List file-level metrics — Includes LOC, complexity, tokens, loop count, and condition count.
  - List all test case titles — May include unit and end-to-end tests.
  - List all environment variable names
  - Support semantic parsing of Dart and Flutter files
  - Support semantic parsing of TypeScript files
  - Support semantic parsing of Go files
  - Run predefined rule-based analysis — Output is generated from the selected rules.
  - Run semantic analysis on a single source file — This reduces implementation scope for v1.
  - Provide AI-friendly output — A `--json` output mode can support this.
  - Provide human-friendly output — Use readable formatting, such as colors.



## title
  - todo
