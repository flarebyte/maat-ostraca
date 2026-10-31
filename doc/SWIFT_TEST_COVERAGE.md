# Swift regression coverage

Swift implements 16 rules: the 13 universal rules plus class maps, protocol maps,
and protocol source snippets. Imported function/type classification is unsupported.
All result fields conform to the existing cross-language schemas.

`test/swift.rules.test.ts` has 61 cases covering all adapters with empty input and
expected-value checks for imports, selective paths, environment keys, raw/multiline
strings, interpolation/computed-expression exclusion, escapes, logging, thrown
arguments, overload keys, generics, extensions, nested functions/types, lifecycle
methods, actors/value types, protocol requirements, known versus ambiguous
inheritance, I/O attribution, control-flow metrics, Unicode, CRLF, attributes,
conditional compilation and incomplete-source recovery. Separate processes verify
Swift registration before/after both Python and Rust.

`script/e2e/swift.test.ts` has 36 cases. Every rule participates in analyse/diff
schema, golden and repeated-byte checks. Other cases cover stdin, diff-to-stdin,
Unicode, errors, parser recovery, empty input/files, manifest filtering,
delta-only output, exit-code-on-change, human output, literal filtering and the
compiled entrypoint. Four more cases run in the common language matrix, and four
run identical portable queries in the all-language query contract matrix.

Fixtures and approved outputs are in `testdata/swift/regression/`. These are
static-analysis inputs rather than a Swift package to compile. They intentionally
include external symbols and test attributes without loading their dependencies.

Run:

```sh
node --import tsx --test test/swift.rules.test.ts
npm run build
bun test script/e2e/swift.test.ts script/e2e/language_query_contract.test.ts
npm run test:cov
npm run test:e2e
make dup
```

The introduction coverage snapshot for Swift adapters and Swift helpers was
563/566 lines (99.47%) and 217/235 branches (92.34%), aggregated from
`src/rules/<rule>/swift.ts` and `src/rules/_shared/swift/` in `coverage/lcov.info`.
Shared infrastructure, including the reusable syntax-metrics walker, is excluded
from this language-specific comparison. Percentages measure exercised code, not
semantic completeness, and are a snapshot rather than an enforced threshold.

Validation: 460 unit tests and 255 e2e tests passed; existing language goldens were
preserved, including Rust after extracting its metrics traversal into a shared
helper. Lint, build, typecheck and zero-clone checks passed. A temporary npm tarball
was installed outside the checkout and exercised all Swift rules, with explicit
checks for protocol maps, environment keys, test titles and I/O counts.
