import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { SUPPORTED_LANGUAGES } from '../src/core/contracts/language.js';
import { runAnalyse } from '../src/core/run-analyse.js';
import { countIoBySymbol } from '../src/rules/_shared/typescript/io_count.js';
import { resolveRules } from '../src/rules/resolve.js';

import { languageContractMatrix } from './language-contract-matrix.js';
import { contractsForLanguage } from './rule-result-contracts.js';

for (const { language, from, to } of languageContractMatrix) {
  for (const file of [from, to])
    test(`${language} public rule results obey the same strict contract: ${file}`, async () => {
      const contracts = contractsForLanguage(language);
      const rules = resolveRules({
        language,
        rules: Object.keys(contracts).join(','),
      });
      const output = await runAnalyse({
        source: readFileSync(file, 'utf8'),
        language,
        rules,
      });
      assert.ok(rules.length >= 13);
      for (const [rule, schema] of Object.entries(contracts))
        assert.ok(
          schema.safeParse(output.rules[rule]).success,
          `${language}:${rule}: ${JSON.stringify(schema.safeParse(output.rules[rule]))}`,
        );
      // Require populated maps: empty objects must not make shape tests pass vacuously.
      for (const rule of [
        'function_map',
        'method_map',
        'interface_map',
        'class_map',
      ].filter((name) => name in contracts))
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

test('public contract matrix covers every supported language', () => {
  assert.deepEqual(
    languageContractMatrix.map((row) => row.language).sort(),
    [...SUPPORTED_LANGUAGES].sort(),
  );
});
test('all languages share the same 13 core selectors', () => {
  const sets = languageContractMatrix.map(
    (row) => new Set(Object.keys(contractsForLanguage(row.language))),
  );
  const universal = [...(sets[0] ?? new Set<string>())].filter((rule) =>
    sets.every((set) => set.has(rule)),
  );
  assert.equal(universal.length, 13);
  assert.ok(!universal.includes('class_map'));
  assert.ok(!universal.includes('interface_map'));
});

test('TypeScript IO includes annotated arrows, typed variables and generic declarations', async () => {
  const source =
    'function load<T>() { fs.readFileSync("in"); } const save: (value: string) => void = (value: string): void => { fs.writeFileSync("out", value); };';
  assert.deepEqual(await countIoBySymbol(source, 'typescript', 'all'), {
    functions: { load: 1, save: 1 },
    methods: {},
  });
});
