import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { run } from '../src/rules/function_map/typescript.js';

describe('rule function_map/typescript', () => {
  it('extracts function declarations and const assigned functions', async () => {
    const source = [
      'export default async function alpha(a: string, b: number): Promise<void> { return; }',
      'const beta = (x: Foo, y): Bar => x as unknown as Bar;',
      'export const gamma = function(z: Baz): Qux { return z as unknown as Qux; };',
    ].join('\n');

    const result = await run({ source, language: 'typescript' });

    assert.deepEqual(Object.keys(result), ['alpha', 'beta', 'gamma']);
    assert.deepEqual(result.alpha, {
      modifiers: ['async', 'default', 'export'],
      params: ['a: string', 'b: number'],
      returns: ['Promise<void>'],
    });
    assert.deepEqual(result.beta, {
      modifiers: [],
      params: ['x: Foo', 'y'],
      returns: ['Bar'],
    });
    assert.deepEqual(result.gamma, {
      modifiers: ['export'],
      params: ['z: Baz'],
      returns: ['Qux'],
    });
  });
});
