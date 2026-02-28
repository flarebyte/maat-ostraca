import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { search } from '../src/core/astgrep/search.js';

describe('astgrep.search', () => {
  it('returns matches for a simple TypeScript pattern', async () => {
    const source = 'import a from "pkg";\nimport "side";\n';

    const matches = await search({
      source,
      language: 'typescript',
      pattern: 'import $A from $B',
    });

    assert.deepEqual(matches, [{ text: 'import a from "pkg";' }]);
  });
});
