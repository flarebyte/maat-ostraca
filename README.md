# maat-ostraca

`maat-ostraca` is a CLI that analyzes source files and returns structured,
machine-friendly insights.

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

## Determinism Guarantees

- Canonical JSON output with stable key ordering
- Sorted and deduped list outputs where applicable
- Golden-test coverage across analyse and diff flows
- Repeated-run byte stability for the same inputs and rule selection

JSON output is the machine contract. Non-JSON output is human-oriented, but remains deterministic for the same command input.
