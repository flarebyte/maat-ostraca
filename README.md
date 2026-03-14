# maat-ostraca

`maat-ostraca` is a TypeScript CLI that analyzes source files and returns
structured, machine-friendly insights.

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
maat analyse --in testdata/analyse-input.ts --rules code_hash,file_metrics --language typescript --json

# Analyse from stdin
cat testdata/analyse-input.ts | maat analyse --rules code_hash --language typescript --json

# Diff two snapshots
maat diff --from testdata/metrics/v1.ts --to testdata/metrics/v2.ts --rules file_metrics --language typescript --json
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
