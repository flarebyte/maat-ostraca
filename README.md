# maat-ostraca

`maat-ostraca` is a CLI that analyzes source files and returns structured,
machine-friendly insights.

![Maat Ostraca](./maat-ostraca-hero.jpeg)

At a high level, the CLI is designed to:

- Parse code from a file path or stdin
- Run selected analysis rules on one source snapshot or a diff between two snapshots
- Return predictable JSON output focused on maps and stable ordering
- Help track code structure and evolution across time or across projects

The output model emphasizes direct key access (for example, function/method/class/interface maps),
compact metrics, and optional delta-focused diff views for low-noise reporting.

## Quick Start

Install and run locally:

```bash
npm install
npm run build
npm link
maat rules --language typescript --json
```

Or run without linking:

```bash
npx maat-ostraca rules --language typescript --json
```

Basic commands:

```bash
# Analyse one file
maat analyse --in testdata/determinism/wide-v1.ts --rules import_files_list,file_metrics,code_hash --language typescript --json

# Analyse all rules for one language
maat analyse --in testdata/go/determinism/wide-v1.go --rules '*' --language go --json

# Diff two snapshots
maat diff --from testdata/go/hash/v1.go --to testdata/go/hash/v2.go --rules code_hash --language go --json

# List rules for one language
maat rules --language dart --json

# Analyse from stdin when --in is omitted
cat testdata/dart/env/analyse.dart | maat analyse --rules env_names_list --language dart --json
```

## Supported Commands

- `analyse`
- `diff`
- `rules`

## Language Support Matrix

- `typescript`: imports, metrics, code hash, symbol maps, I/O counts, messages, env names, testcase titles
- `go`: imports, metrics, code hash, symbol maps, I/O counts, messages, env names, testcase titles
- `dart`: imports, metrics, code hash, symbol maps, I/O counts, messages, env names, testcase titles
- `python`: Python 3 imports, metrics, code hash, function/method/class maps, I/O counts, messages, env names, testcase names

## Determinism Guarantees

- Canonical JSON output with stable key ordering
- Sorted and deduped list outputs where applicable
- Golden-test coverage across analyse and diff flows
- Repeated-run byte stability for the same inputs and rule selection

JSON output is the machine contract. Non-JSON output is human-oriented, but remains deterministic for the same command input.

## Python 3

```bash
maat analyse --in example.py --language python --rules '*' --json
maat diff --from before.py --to after.py --language python --rules '*' --json
```

Python analysis is static and uses a bundled Tree-sitter parser through ast-grep;
it does not execute the source or require a Python interpreter at runtime.
Functions and classes use dotted enclosing names as map keys. Relative import
prefixes are preserved. `package_imports_list` includes absolute modules, which
may be standard-library, third-party, or local modules. Import function/type
classification and interface rules are unsupported.

Metrics use syntax blocks for nesting and count `for`/`while` loops and
`if`/`elif`/`case` conditions. Cognitive complexity currently equals cyclomatic
complexity. Tokens currently count identifier nodes; SLOC counts nonblank lines.
I/O detection recognizes `input`, `print`, `os.read`/`os.write`, and common
read/write method names; it does not infer receiver types. Counts include calls
inside nested declarations. Environment detection recognizes `os.getenv`,
`os.environ.get`, and literal `os.environ[...]` keys. Messages cover raised
constructor calls and `logging`/`logger` error, exception, and critical calls.
Only literal string arguments are extracted; interpolated messages are omitted.
Tests are functions/methods beginning with `test_`; parameterized test cases are
not expanded. Python 3 syntax coverage follows the bundled parser; this is not
a Python version compatibility validator.
