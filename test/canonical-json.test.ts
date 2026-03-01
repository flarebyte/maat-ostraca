import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canonicalStringify } from '../src/core/format/canonical-json.js';

describe('canonical stringify', () => {
  it('produces identical bytes for objects with different key insertion order', () => {
    const a = {
      z: 1,
      nested: { b: 2, a: 1 },
      arr: [{ y: 2, x: 1 }],
    };
    const b = {
      arr: [{ x: 1, y: 2 }],
      nested: { a: 1, b: 2 },
      z: 1,
    };

    assert.equal(canonicalStringify(a), canonicalStringify(b));
  });
});
