# JSON queries across languages

TypeScript, Go, Dart, Python and Rust share 13 implemented core rules with the
same result shapes. Additional rules share the same contracts wherever supported.
The same selectors and JSON projections work across languages:

```sh
maat analyse --in "$SOURCE_FILE" --language "$LANGUAGE" \
  --rules function_map,method_map,file_metrics --json |
  jq '.rules.method_map[] | {name, receiver, loc, ioCallsCount}'

maat analyse --in "$SOURCE_FILE" --language "$LANGUAGE" \
  --rules interface_map --json |
  jq '.rules.interface_map | to_entries | map({key, methods: .value.methods})'
```

Set `LANGUAGE` to `typescript`, `go`, `dart`, `python`, or `rust` and provide
a corresponding source file. The interface query requires an interface-capable
language (all except Python).

| Rule results | Common JSON shape |
| --- | --- |
| Import, message, environment, test lists | Sorted arrays of strings |
| File metrics | Numeric `loc`, `sloc`, `tokens`, `loops`, `conditions`, `cyclomaticComplexity`, `cognitiveComplexity`, `maxNestingDepth` |
| Code hash | `{algorithm: "sha256", file: string}` |
| Function map | Identifier keys to modifiers/params/returns arrays, numeric metrics and I/O counters, `sha256` |
| Method map | Function fields plus string `name` and `receiver` |
| Interface map | Identifier keys to string arrays `modifiers`, `extends`, `methods` |
| Interface source map | Identifier keys to source strings |
| I/O counts | `{functions: {identifier: number}, methods: {identifier: number}}` |

The 13 universal rules are imports/packages, environment/messages/test lists,
file metrics/hash, function/method maps, and the three I/O counters.

| Language | Implemented rules | Class maps | Interface maps/source |
| --- | ---: | --- | --- |
| TypeScript | 16 | Yes | Yes |
| Go | 15 | No | Yes |
| Dart | 16 | Yes | Yes |
| Python | 14 | Yes | No |
| Rust | 15 | No | Yes (traits) |

Class entries share `modifiers`, optional `extends`/`implements`, `methodCount`,
`sha256`, and six numeric fields: `loc`, `sloc`, `tokens`, `cyclomaticComplexity`,
`cognitiveComplexity`, `maxNestingDepth`. They do not include function-only fields.
Python's previous extra class-level `loops`/`conditions` fields were removed to
match this contract. TypeScript I/O now includes typed arrows/variables and generic
function declarations, matching the function map's declaration coverage.

`--rules '*'` expands to each language's implemented rules, so wildcard outputs
need not have identical sets of rule names. Use
`maat rules --language "$LANGUAGE" --json` to discover capabilities. Imported
function/type classification is unimplemented in all languages, despite older
catalog entries for TypeScript, Go and Dart.

Treat symbol keys as opaque: Rust uses module/impl paths; Dart uses its own
qualified symbol names. Parameter/return strings and modifier values retain
source-language syntax. Imports represent language-specific module/package
paths. Metrics have shared names/types but documented language-specific
approximations; schema compatibility does not imply numerically equivalent
complexity or token counts for translated programs.

Diff results use the same language-independent engine: lists have `added` and
`removed`, map entries have `status`, numeric changes have `from`/`to`/`delta`,
and hashes have `from`/`to`/`changed`. `--delta-only` makes numeric changes numbers
and omits the original hash strings consistently for both languages.

`test/rule-result-contracts.ts` defines strict, shared schemas for every implemented
rule. `test/language-contract-matrix.ts` supplies both snapshots for all supported
languages; unit tests enforce that no language or implemented rule lacks a
contract. The tests require populated supported function/method/interface/class
maps and check that symbol keys align with their I/O counters.

`script/e2e/language_query_contract.test.ts` executes portable projections through
the actual CLI for analyse, standard diff and delta-only diff, plus the exact same
13-rule selector across all five languages. Capability-specific rules are tested
where implemented. These checks complement each language's golden tests and
reject missing fields, extra fields and incompatible field types.
