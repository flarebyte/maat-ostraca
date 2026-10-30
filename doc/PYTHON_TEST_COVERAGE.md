# Python regression coverage

Python has 39 unit cases across `test/python.test.ts` and
`test/python.rules.test.ts`. They cover all 14 supported rule adapters, empty
inputs, exact import lists, aliases, relative imports, deduplication, dynamic
literal exclusion, multiline strings, nested scopes, decorators, annotations,
class inheritance, metrics, IO counters, Unicode, CRLF hashes, and unsupported
rule selection. Expected values are asserted independently of golden generation.

`script/e2e/python.test.ts` adds 27 cases. Every supported rule participates in
analyse and diff golden checks, schema validation, and repeated-byte checks.
Additional cases exercise stdin, wildcard/explicit/reordered rules, the rule
manifest, unsupported-rule errors, delta-only output, human formatting, and the
packaged CLI. The shared language matrix adds four Python cases covering the
common-rule contract.

Fixtures and approved JSON outputs live in `testdata/python/regression/`.
Golden comparisons canonicalize JSON, so file formatting is immaterial.

Run the checks with:

```sh
node --import tsx --test test/python*.test.ts
npm run build
bun test script/e2e/python.test.ts script/e2e/language_matrix.test.ts
npm run test:cov
npm run test:e2e
```

Coverage snapshot after adding these tests (323 unit cases passing):

| Rule modules and language helpers | Lines | Branches |
| --- | ---: | ---: |
| Python | 100.00% | 91.52% |
| TypeScript | 92.81% | 84.81% |
| Go | 85.43% | 72.20% |
| Dart | 82.61% | 75.71% |

These figures aggregate `src/rules/<rule>/<language>.ts` and
`src/rules/_shared/<language>/` from `coverage/lcov.info`, using hit/found totals
rather than averaging file percentages. Shared CLI infrastructure is excluded
from this language comparison. Coverage measures exercised code, not semantic
completeness; the documented Python heuristics and unsupported rules still
apply. The table is a snapshot, not an enforced coverage threshold.
