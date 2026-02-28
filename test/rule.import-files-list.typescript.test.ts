import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { run } from '../src/rules/import_files_list/typescript.js';

describe('rule import_files_list/typescript', () => {
  it('handles default, named, namespace and side-effect imports', async () => {
    const source = [
      'import z from "z";',
      'import { a, b as c } from "./a";',
      'import * as ns from "../ns";',
      'import "./side";',
    ].join('\n');

    const result = await run({
      source,
      language: 'typescript',
    });

    assert.deepEqual(result, ['../ns', './a', './side', 'z']);
  });

  it('dedupes repeated imports and sorts output', async () => {
    const source = [
      'import z from "z";',
      'import "./b";',
      'import y from "y";',
      'import z2 from "z";',
      'import "./b";',
    ].join('\n');

    const result = await run({
      source,
      language: 'typescript',
    });

    assert.deepEqual(result, ['./b', 'y', 'z']);
  });

  it('returns empty list when no imports are present', async () => {
    const result = await run({
      source: 'const value = 1;\n',
      language: 'typescript',
    });

    assert.deepEqual(result, []);
  });
});
