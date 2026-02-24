# FLOW DESIGN OVERVIEW (Generated)

## Function calls tree

```
maat CLI root command
  Parse args for analysing the source code
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



## Exit Codes
  - 0: success (no errors)
  - 1: fatal setup/validation error (no output)
  - 2: partial failures (some per-item errors present)
  - 3: script/reduce failure (pipeline aborted)

## title
  - todo
