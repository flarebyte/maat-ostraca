# maat-ostraca

Analyze source files and compare code snapshots with one CLI and consistent JSON
across **TypeScript, Go, Dart, Python 3, Rust, and Swift**.

![Maat Ostraca](./maat-ostraca-hero.jpeg)

`maat` extracts imports, symbols, metrics, I/O counts, messages, environment keys,
and test names. Use it in scripts, code reviews, or reports without building a
separate query for each language. Analysis is static and operates on one source
file at a time.

## Install

Requires **Node.js 24 or newer**.

```sh
npm install --global maat-ostraca
maat --help
```

Or run the published package without a global installation:

```sh
npx maat-ostraca rules --language typescript --json
```

The examples below use `maat`. When working from a checkout, use
`npm run cli --` in its place; checkout capabilities may be newer than the
published package.

## Quick start

Choose a source file and its language explicitly:

```sh
SOURCE_FILE=src/lib.rs
LANGUAGE=rust

# Discover this language's rules.
maat rules --language "$LANGUAGE" --json

# Analyze every implemented rule for this language.
maat analyse --in "$SOURCE_FILE" --language "$LANGUAGE" --rules '*' --json

# Select portable rules for a smaller report.
maat analyse --in "$SOURCE_FILE" --language "$LANGUAGE" \
  --rules function_map,method_map,file_metrics --json
```

Use the same commands with any supported language:

| `--language` | Example source file | Class maps | Interface maps   |
| ------------ | ------------------- | ---------- | ---------------- |
| `typescript` | `src/index.ts`      | Yes        | Yes              |
| `go`         | `main.go`           | No         | Yes              |
| `dart`       | `lib/main.dart`     | Yes        | Yes              |
| `python`     | `app.py`            | Yes        | No               |
| `rust`       | `src/lib.rs`        | No         | Yes, from traits |

The CLI does not infer the language from the filename. Python, Rust, and Swift analysis
requires no Python interpreter, Cargo/rustc, Swift compiler, or Xcode at runtime.

## Commands

| Command   | Inputs                                                     | Purpose                                    |
| --------- | ---------------------------------------------------------- | ------------------------------------------ |
| `analyse` | `--in <file>`, or stdin                                    | Analyze one snapshot                       |
| `diff`    | `--from <file>` and `--to <file>`, or stdin for the target | Compare two snapshots of the same language |
| `rules`   | `--language`; optional `--match <names>`                   | List rule names and descriptions           |

`analyse` and `diff` require `--language` and `--rules`. Add `--json` for machine
output; omit it for a human-readable report. Run `maat <command> --help` for all
options. Sources are limited to 5 MiB each; empty stdin is rejected.

### Select rules

All six languages implement these 13 rules:

| Group       | Rule names                                                      |
| ----------- | --------------------------------------------------------------- |
| Imports     | `import_files_list`, `package_imports_list`                     |
| Symbols     | `function_map`, `method_map`                                    |
| Metrics     | `file_metrics`, `code_hash`                                     |
| I/O         | `io_calls_count`, `io_read_calls_count`, `io_write_calls_count` |
| Messages    | `exception_messages_list`, `error_messages_list`                |
| Environment | `env_names_list`                                                |
| Tests       | `testcase_titles_list`                                          |

Class-capable languages also implement `class_map`. Interface-capable languages
implement `interface_map` and `interfaces_code_map`.

```sh
# Explicit names, a prefix wildcard, or all implemented rules.
maat analyse --in "$SOURCE_FILE" --language "$LANGUAGE" --rules 'io_*,file_metrics' --json
maat analyse --in "$SOURCE_FILE" --language "$LANGUAGE" --rules '*' --json

# Manifest filtering accepts exact names, not wildcard selectors.
maat rules --language "$LANGUAGE" --match function_map,code_hash --json
```

Quote wildcard selectors to prevent shell expansion. `'*'` expands to the
implemented rules for the selected language, so its output keys vary by
capability. Imported function/type classification is not implemented; older
catalog entries may still list `import_functions_list` and `import_types_list`
for TypeScript, Go, and Dart.

### Read from stdin

```sh
cat "$SOURCE_FILE" | maat analyse --language "$LANGUAGE" --rules env_names_list --json
```

For example, this self-contained command:

```sh
printf 'process.env.API_TOKEN;\n' | maat analyse --language typescript --rules env_names_list --json
```

returns:

```json
{ "language": "typescript", "rules": { "env_names_list": ["API_TOKEN"] } }
```

### Query JSON

JSON is the machine contract: stable key ordering, predictable maps, and sorted,
deduplicated lists where applicable. These `jq` queries work across all six
languages:

```sh
maat analyse --in "$SOURCE_FILE" --language "$LANGUAGE" --rules function_map --json \
  | jq '.rules.function_map | to_entries | map({symbol: .key, lines: .value.loc})'

maat analyse --in "$SOURCE_FILE" --language "$LANGUAGE" --rules method_map --json \
  | jq '.rules.method_map[] | {name, receiver, ioCallsCount}'
```

Treat symbol keys as opaque identifiers. Signatures, import paths, and metric
approximations reflect each language's syntax. Shared field names and types do
not imply equal metric values for translated programs.

See the [cross-language JSON contract](doc/LANGUAGE_JSON_CONTRACT.md) for result
shapes, capability differences, and the tests that enforce portability.

### Compare snapshots

```sh
maat diff --from before.rs --to after.rs --language rust \
  --rules function_map,file_metrics,code_hash --json

# Emit numeric deltas directly and omit the original hash strings.
maat diff --from before.rs --to after.rs --language rust \
  --rules function_map,file_metrics,code_hash --delta-only --json

# Read the target snapshot from stdin.
cat after.rs | maat diff --from before.rs --language rust --rules code_hash --json
```

The same flags work for every supported language. List diffs have `added` and
`removed` arrays; symbol-map entries have a `status`; standard numeric diffs
have `from`, `to`, and `delta` fields.

Add `--exit-code-on-change` to `diff` to signal changes to a script:

| Exit code | Meaning                                                |
| --------- | ------------------------------------------------------ |
| `0`       | Success; without the flag, a changed diff also exits 0 |
| `1`       | Internal analysis failure                              |
| `2`       | Invalid usage or input, including unreadable files     |
| `3`       | Changes detected with `--exit-code-on-change`          |

With `--json`, errors use an `error` object containing `code` and `message`.
Successful human output is also deterministic, but scripts should use JSON.

## Analysis scope

Analysis extracts syntax and documented patterns; it does not execute source
code. Dynamic messages, runtime dependency resolution, receiver types, and
macro-generated code may not be discoverable. Rust does not evaluate `cfg`
branches, and Python/Rust/Swift parser recovery may return partial results for
incomplete code.

See [language analysis notes](doc/LANGUAGE_NOTES.md) for extraction conventions
and language-specific limitations.

## Develop locally

Requires Node.js 24+ and npm. Install **Bun** to run the e2e suite; the release
workflow uses Bun 1.3.6. `jq` is optional for the query examples above.

```sh
git clone https://github.com/flarebyte/maat-ostraca.git
cd maat-ostraca
npm ci
npm run build
npm run cli -- rules --language rust --json
```

To expose the checkout's compiled CLI as `maat`, run `npm link` after building.
Rebuild after source changes when using the linked executable.

| Task                                  | Command                             |
| ------------------------------------- | ----------------------------------- |
| Typecheck                             | `npm run typecheck`                 |
| Unit tests                            | `npm test`                          |
| Build CLI into `dist/`                | `npm run build`                     |
| E2e tests, including the compiled CLI | `npm run build && npm run test:e2e` |
| Unit coverage                         | `npm run test:cov`                  |
| Lint                                  | `make lint`                         |
| Format and apply lint fixes           | `make format`                       |
| Duplication check                     | `make dup`                          |

The implementation lives under `src/`, unit tests under `test/`, CLI integration
tests under `script/e2e/`, and source fixtures/golden JSON under `testdata/`.
Golden tests check analyse/diff output and repeated-run byte stability.
Shared contract tests exercise portable queries across every supported language.

For a language extension, add rule adapters under `src/rules/<rule>/<language>.ts`,
shared extraction helpers under `src/rules/_shared/<language>/`, and entries in
the capability and contract-test matrices. Add expected-value tests and CLI
goldens alongside the implementation.

Coverage details: [Python](doc/PYTHON_TEST_COVERAGE.md) and
[Rust](doc/RUST_TEST_COVERAGE.md), and [Swift](doc/SWIFT_TEST_COVERAGE.md). Release setup and recovery:
[releasing](.github/RELEASING.md).
