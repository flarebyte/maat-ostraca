import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runAnalyse } from '../src/core/run-analyse.js';
import { resolveRules } from '../src/rules/resolve.js';

import { commonRuleContracts } from './rule-result-contracts.js';

for (const [language, paths] of [
  [
    'dart',
    [
      'testdata/dart/determinism/wide-v1.dart',
      'testdata/dart/determinism/wide-v2.dart',
    ],
  ],
  [
    'rust',
    ['testdata/rust/regression/v1.rs', 'testdata/rust/regression/v2.rs'],
  ],
] as const) {
  for (const file of paths)
    test(`${language} public rule results obey the same strict contract: ${file}`, async () => {
      const rules = resolveRules({
        language,
        rules: Object.keys(commonRuleContracts).join(','),
      });
      const output = await runAnalyse({
        source: readFileSync(file, 'utf8'),
        language,
        rules,
      });
      assert.equal(rules.length, 15);
      for (const [rule, schema] of Object.entries(commonRuleContracts))
        assert.ok(
          schema.safeParse(output.rules[rule]).success,
          `${language}:${rule}: ${JSON.stringify(schema.safeParse(output.rules[rule]))}`,
        );
      // Require populated maps: empty objects must not make shape tests pass vacuously.
      for (const rule of ['function_map', 'method_map', 'interface_map'])
        assert.ok(
          Object.keys(output.rules[rule] as object).length > 0,
          `${language}:${rule} fixture must exercise entries`,
        );
      for (const kind of ['functions', 'methods']) {
        const symbols = output.rules[
          kind === 'functions' ? 'function_map' : 'method_map'
        ] as Record<string, Record<string, unknown>>;
        const io = output.rules.io_calls_count as Record<
          string,
          Record<string, number>
        >;
        assert.deepEqual(
          Object.keys(symbols).sort(),
          Object.keys(io[kind]).sort(),
        );
        for (const [key, value] of Object.entries(symbols))
          assert.equal(value.ioCallsCount, io[kind][key]);
      }
    });
}
