# FLOW DESIGN OVERVIEW (Generated)

## Function calls tree

```
maat CLI root command [cli.root]
  - pkg: cmd/maat
  Parse args for analysing the source code [cli.analyse]
    - note: flags: --in filename.go --rules io.calls.count,import.file.list --language go --json. Uses of commander.js
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

  - Count all IO calls
  - Count all Read IO calls
  - Count all Write IO calls
  - list all imports files
  - list all imported functions
  - list all imported types
  - list all import of external packages
  - list all exceptions messages
  - list all error messages
  - list all functions signatures — Parameters / return signature
  - list all functions metrics — Metrics includes LOC, complexity, tokens, number of loops, number of conditions, number of returns
  - list all method signatures — Parameters / return signature
  - list all methods metrics — Metrics includes LOC, complexity, tokens, number of loops, number of conditions, number of returns
  - list all interfaces
  - list all classes
  - list all classes metrics — Metrics includes LOC, complexity, tokens, number of methods
  - list the code of all the interfaces
  - Metrics for the files — Metrics includes LOC, complexity, tokens, number of loops, number of conditions
  - list all test cases titles — testcase may includes unit tests and e2e tests
  - list all environment names
  - Support semantic parsing of Dart/Flutter file
  - Support semantic parsing of Typescript file
  - Support semantic parsing of go file
  - Predefined rules based analysis — Output will be composed based on the selected rules
  - Sementic analysis should be performed a single source file — This is the reduce the scope of the implementation for v1
  - Output should be ai friendly — A --json output could achieve this
  - Output should be human friendly — Perhhaps some colors



## title
  - todo
