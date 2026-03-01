import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { kind, Lang, parse } from '@ast-grep/napi';
import { readLiteralString } from '../src/rules/_shared/typescript/string_literals.js';

describe('string literal normalizer', () => {
  it('normalizes single, double and no-expression template literals', () => {
    const root = parse(
      Lang.TypeScript,
      'const a=\'a\'; const b="b"; const c=`c`; ',
    ).root();
    const literals = [
      ...root.findAll(kind(Lang.TypeScript, 'string')),
      ...root.findAll(kind(Lang.TypeScript, 'template_string')),
    ];

    const values = literals
      .map((node) => readLiteralString(node))
      .filter((value): value is string => value !== undefined)
      .sort((a, b) => a.localeCompare(b));

    assert.deepEqual(values, ['a', 'b', 'c']);
  });
});
