# Rust regression coverage

Rust supports 15 rules: imports/packages, file metrics/hash, function/method maps,
trait maps/source snippets, environment names, exception/error messages, test
names, and three I/O counters. Class maps and imported function/type
classification remain explicitly unsupported.

`test/rust.rules.test.ts` has 61 cases, including every rule adapter with empty
input and independent expected-value assertions for grouped/relative/aliased
imports, visibility, lifetimes, generics, qualified method keys, trait default
methods, attributes, nested modules/functions, closures, match guards, nested
comments, raw/escaped strings, Unicode, CRLF hashing, parser recovery and `cfg`
branches. Separate processes verify Python-then-Rust and Rust-then-Python parser
registration, without relying on the test runner's module order.

`script/e2e/rust.test.ts` has 38 cases. Every supported rule participates in
analyse/diff golden checks, schema validation and repeated-byte checks. Additional
checks cover stdin, Unicode/CRLF, explicit/reversed/wildcard/prefix selectors,
manifest consistency, unsupported-rule envelopes, delta-only output,
exit-code-on-change, human output, and the compiled CLI entrypoint. Four more
Rust cases run through the shared cross-language matrix.

Approved snapshots live in `testdata/rust/regression/`. These are parser inputs,
not Cargo projects: analysis does not compile or expand macros. The README
specifies the metric conventions, syntactic patterns and limitations.

Run:

```sh
node --import tsx --test test/rust.rules.test.ts
npm run build
bun test script/e2e/rust.test.ts script/e2e/language_matrix.test.ts
npm run test:cov
npm run test:e2e
make dup
```

Coverage snapshot from the full unit suite: Rust rule adapters and shared Rust
helpers covered 590/594 lines (99.33%) and 241/254 branches (94.88%). This aggregates
`src/rules/<rule>/rust.ts` and `src/rules/_shared/rust/` from `coverage/lcov.info`;
shared CLI code is excluded. It measures code execution, not semantic completeness,
and is a snapshot rather than an enforced threshold.

Validation after the coverage audit: 384 unit tests and 191 e2e tests passed, existing
language goldens were preserved, the package dry run included the compiled Rust
modules, and duplication detection reported zero clones with the existing
configuration.

The follow-up audit added explicit checks for comments within grouped imports and
`Error::new` arguments (both exposed and fixed extraction bugs), empty/byte-string
messages, nested I/O attribution, duplicate `cfg` keys, associated types/constants,
raw identifiers, and opaque macro bodies. Added CLI checks cover these comment
regressions, diff-to-stdin, empty files, rejected empty stdin, `rules --match`,
non-JSON usage errors, parser recovery, and missing-file error envelopes.

In the same unit run, Rust's 94.88% branch coverage exceeded Python's 91.36%,
TypeScript's 84.65%, Dart's 77.69%, and Go's 74.56% under the same aggregation.
Rust line coverage was 99.33% versus Python's 100%; coverage percentages do not
establish correctness of every Rust construct. The explicit behavior assertions
and per-rule CLI golden checks are the primary regression contract.
