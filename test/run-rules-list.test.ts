import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { runRulesList } from '../src/core/run-rules-list.js';

describe('runRulesList', () => {
  it('returns rules sorted lexicographically for each language', async () => {
    for (const language of ['typescript', 'go', 'dart'] as const) {
      const result = await runRulesList({ language });
      const names = result.rules.map((rule) => rule.name);
      const sorted = [...names].sort((left, right) =>
        left.localeCompare(right),
      );

      assert.deepEqual(names, sorted);
    }
  });

  it('keeps existing rule descriptions stable for canonical manifests', async () => {
    const typescript = await runRulesList({ language: 'typescript' });
    const go = await runRulesList({ language: 'go' });
    const dart = await runRulesList({ language: 'dart' });

    assert.equal(
      typescript.rules.find((rule) => rule.name === 'code_hash')?.description,
      'Compute deterministic code-level content hash.',
    );
    assert.equal(
      go.rules.find((rule) => rule.name === 'function_map')?.description,
      'Map function declarations and signatures.',
    );
    assert.equal(
      dart.rules.find((rule) => rule.name === 'class_map')?.description,
      'Map class declarations and members.',
    );
  });
});
