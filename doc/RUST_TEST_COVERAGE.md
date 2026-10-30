# Rust regression coverage

Rust supports 15 rules: imports/packages, file metrics/hash, function/method maps,
trait maps/source snippets, environment names, exception/error messages, test
names, and three I/O counters. Class maps and imported function/type
classification remain explicitly unsupported.

`test/rust.rules.test.ts` has 53 cases, including every rule adapter with empty
input and independent expected-value assertions for grouped/relative/aliased
imports, visibility, lifetimes, generics, qualified method keys, trait default
methods, attributes, nested modules/functions, closures, match guards, nested
comments, raw/escaped strings, Unicode, CRLF hashing, parser recovery and `cfg`
branches. Separate processes verify Python-then-Rust and Rust-then-Python parser
registration, without relying on the test runner's module order.

`script/e2e/rust.test.ts` has 30 cases. Every supported rule participates in
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
helpers covered 582/586 lines (99.32%) and 238/251 branches (94.82%). This aggregates
`src/rules/<rule>/rust.ts` and `src/rules/_shared/rust/` from `coverage/lcov.info`;
shared CLI code is excluded. It measures code execution, not semantic completeness,
and is a snapshot rather than an enforced threshold.

Validation at introduction: 376 unit tests and 183 e2e tests passed, existing
language goldens were preserved, the package dry run included the compiled Rust
modules, and duplication detection reported zero clones with the existing
configuration.
