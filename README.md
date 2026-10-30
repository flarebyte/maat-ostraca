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
- `rust`: imports, metrics, code hash, function/method maps, trait maps, I/O counts, messages, env names, testcase names

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

## Rust

```bash
maat analyse --in src/lib.rs --language rust --rules '*' --json
maat diff --from before.rs --to after.rs --language rust --rules '*' --json
maat rules --language rust --json
```

Rust analysis uses the bundled Tree-sitter parser through ast-grep. It requires
neither Cargo nor rustc and does not expand macros, load dependencies, resolve
types, or evaluate `cfg` attributes. Syntax support follows the parser grammar,
not a guarantee that every Rust edition construct is supported. Incomplete input
is parsed with recovery, so results may be partial rather than compiler errors.

- Imports expand grouped `use` declarations into paths, preserve `crate`, `self`,
  `super`, aliases' original paths, and globs, and include `extern crate`.
  `package_imports_list` returns distinct roots excluding `crate`/`self`/`super`.
  An unqualified root may be a dependency or local module; this is not dependency
  resolution. Aliases are recognized syntactically across the file; lexical
  shadowing and glob expansion are not resolved.
- Free-function keys include enclosing modules/functions, such as
  `storage::load`. Methods include associated functions and default trait methods.
  Keys distinguish `storage::Cache<T>::read` from
  `storage::<Cache<T> as Reader>::read`. Visibility and function modifiers,
  typed parameters (including lifetimes), and explicit return types are retained.
  Generic declarations and where-clauses remain in source hashes and trait
  signatures; they have no separate fields in the shared function-map contract.
- Traits map to `interface_map` and `interfaces_code_map`, including supertraits
  and method signatures. Default method bodies are omitted from signature lists
  and retained in source snippets. Associated types/constants remain in snippets.
  `class_map` and imported function/type classification are unsupported.
- Metrics count `for`, `while`, and `loop` expressions; `if` expressions,
  non-wildcard match arms, and match guards contribute conditions. Complexity is
  `1 + loops + conditions` for nonempty input; cognitive complexity uses that
  same v1 approximation. Nesting counts blocks, match blocks, and declaration
  lists. Tokens count syntax leaves (including punctuation), with strings as
  single tokens and comments excluded. SLOC counts nonblank lines, including
  comments. Nested functions and closures contribute to enclosing metrics/I/O;
  explicit `return` expressions alone contribute `returnCount`.
- Environment keys come from literal `std::env::var`/`var_os` arguments and
  `env!`/`option_env!`. Exception-like messages come from `panic!`. Error messages
  recognize literal `Err`, `std::io::Error::new`/`other`, `anyhow!`/`bail!`, and
  `log::error!`/`tracing::error!`. Literal format templates are returned unchanged;
  interpolation values and nested computed messages are not evaluated.
- I/O counts recognize standard filesystem reads/writes, common read/write/flush
  methods, and print/write macros. Method matching is heuristic and does not
  establish receiver types. Macro-generated calls and arbitrary macro bodies
  are not analyzed as executable Rust syntax.
- Test names come from attached `#[test]`, `#[tokio::test]`, or
  `#[async_std::test]` attributes, including ignored tests. Parameterized tests
  are not expanded. All syntactic `cfg` branches are inspected; repeated symbol
  keys use the last declaration in source order, as a file-level approximation.
