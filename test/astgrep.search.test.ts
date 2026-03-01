import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { search, searchByKind } from '../src/core/astgrep/search.js';

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

  it('returns nodes by kind for TypeScript exports', async () => {
    const source = 'export { x } from "pkg";\nexport * from "./local";\n';

    const matches = await searchByKind({
      source,
      language: 'typescript',
      kindName: 'export_statement',
    });

    assert.deepEqual(matches, [
      { text: 'export { x } from "pkg";' },
      { text: 'export * from "./local";' },
    ]);
  });
});
