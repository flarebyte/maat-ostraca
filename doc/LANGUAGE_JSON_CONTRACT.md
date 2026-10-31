# JSON queries across languages

Rust and Dart share 15 implemented rules with the same result shapes. The same
selectors and JSON projections work for both:

```sh
maat analyse --in "$SOURCE_FILE" --language "$LANGUAGE" \
  --rules function_map,method_map,file_metrics --json |
  jq '.rules.method_map[] | {name, receiver, loc, ioCallsCount}'

maat analyse --in "$SOURCE_FILE" --language "$LANGUAGE" \
  --rules interface_map --json |
  jq '.rules.interface_map | to_entries | map({key, methods: .value.methods})'
```

Set `LANGUAGE` to `rust` or `dart` and provide a corresponding source file.

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

Rust traits occupy the interface maps. Rust class maps are unsupported; Dart's
class maps remain available. `--rules '*'` expands to each language's implemented
rules, so wildcard outputs need not have identical sets of rule names. Use
`maat rules --language "$LANGUAGE" --json` to discover capabilities. Neither
language implements imported function/type classification despite the older
catalog entries for Dart.

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

`test/rule-result-contracts.ts` defines strict, shared schemas for the 15 common
rule results. Unit checks require populated function, method and interface maps
from both snapshots of both languages. `script/e2e/language_query_contract.test.ts`
executes identical selectors and projections through the actual CLI for analyse,
standard diff and delta-only diff. These checks complement each language's
golden tests and reject missing fields, extra fields and incompatible field types.
