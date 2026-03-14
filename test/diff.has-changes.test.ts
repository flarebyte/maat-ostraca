import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { DiffOutput } from '../src/core/contracts/outputs.js';
import { hasDiffChanges } from '../src/core/diff/has_changes.js';

const base = (
  rules: Record<string, unknown>,
  deltaOnly?: true,
): DiffOutput => ({
  from: { filename: 'from.ts', language: 'typescript' },
  to: { filename: 'to.ts', language: 'typescript' },
  ...(deltaOnly ? { deltaOnly } : {}),
  rules,
});

describe('hasDiffChanges', () => {
  it('returns false for empty or no-op list diffs', () => {
    assert.equal(
      hasDiffChanges(base({ import_files_list: { added: [], removed: [] } })),
      false,
    );
  });

  it('returns true for list diffs with additions or removals', () => {
    assert.equal(
      hasDiffChanges(
        base({ import_files_list: { added: ['a'], removed: [] } }),
      ),
      true,
    );
    assert.equal(
      hasDiffChanges(
        base({ import_files_list: { added: [], removed: ['a'] } }),
      ),
      true,
    );
  });

  it('returns false for metrics diffs with only zero deltas', () => {
    assert.equal(
      hasDiffChanges(
        base({
          file_metrics: {
            loc: { from: 1, to: 1, delta: 0 },
            tokens: { from: 2, to: 2, delta: 0 },
          },
        }),
      ),
      false,
    );
    assert.equal(
      hasDiffChanges(
        base(
          {
            file_metrics: {
              loc: 0,
              tokens: 0,
            },
          },
          true,
        ),
      ),
      false,
    );
  });

  it('returns true for metrics diffs with any non-zero delta', () => {
    assert.equal(
      hasDiffChanges(
        base({
          file_metrics: {
            loc: { from: 1, to: 2, delta: 1 },
            tokens: { from: 2, to: 2, delta: 0 },
          },
        }),
      ),
      true,
    );
    assert.equal(
      hasDiffChanges(base({ file_metrics: { loc: 1 } }, true)),
      true,
    );
  });

  it('returns false for hash diffs with changed false and true otherwise', () => {
    assert.equal(
      hasDiffChanges(base({ code_hash: { changed: false } }, true)),
      false,
    );
    assert.equal(
      hasDiffChanges(base({ code_hash: { changed: true } }, true)),
      true,
    );
  });

  it('returns false for map diffs with only unchanged or empty objects', () => {
    assert.equal(hasDiffChanges(base({ function_map: {} })), false);
    assert.equal(
      hasDiffChanges(
        base({
          function_map: {
            alpha: { status: 'unchanged' },
          },
        }),
      ),
      false,
    );
  });

  it('returns true for map diffs with added removed or modified statuses', () => {
    assert.equal(
      hasDiffChanges(
        base({
          function_map: {
            alpha: { status: 'added' },
          },
        }),
      ),
      true,
    );
    assert.equal(
      hasDiffChanges(
        base({
          function_map: {
            alpha: { status: 'modified', loc: 1 },
          },
        }),
        true,
      ),
      true,
    );
  });
});
