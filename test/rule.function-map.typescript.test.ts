import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { describe, it } from 'node:test';
import { UsageError } from '../src/core/errors/index.js';
import { extractTypeScriptSymbols } from '../src/rules/_shared/typescript/symbol_extract.js';
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
    assert.deepEqual(result.alpha.modifiers, ['async', 'default', 'export']);
    assert.deepEqual(result.alpha.params, ['a: string', 'b: number']);
    assert.deepEqual(result.alpha.returns, ['Promise<void>']);
    assert.equal(result.alpha.returnCount, 1);
    assert.equal(result.alpha.ioCallsCount, 0);
    assert.equal(
      result.alpha.sha256,
      createHash('sha256')
        .update(
          'async function alpha(a: string, b: number): Promise<void> { return; }',
          'utf8',
        )
        .digest('hex'),
    );

    assert.deepEqual(result.beta.modifiers, []);
    assert.deepEqual(result.beta.params, ['x: Foo', 'y']);
    assert.deepEqual(result.beta.returns, ['Bar']);
    assert.equal(result.beta.returnCount, 0);

    assert.deepEqual(result.gamma.modifiers, ['export']);
    assert.deepEqual(result.gamma.params, ['z: Baz']);
    assert.deepEqual(result.gamma.returns, ['Qux']);
    assert.equal(result.gamma.returnCount, 1);
  });

  it('is deterministic across repeated runs (canonical bytes)', async () => {
    const source =
      'export function alpha(a: string): number { return 1; }\\nconst beta = () => 2;';

    const first = await run({ source, language: 'typescript' });
    const second = await run({ source, language: 'typescript' });

    assert.equal(JSON.stringify(first), JSON.stringify(second));
  });

  it('rejects symbol extraction beyond the maximum threshold', async () => {
    const source = [
      'function a(): number { return 1; }',
      'function b(): number { return 2; }',
      'function c(): number { return 3; }',
    ].join('\n');

    await assert.rejects(
      () => extractTypeScriptSymbols(source, 'typescript', { maxSymbols: 2 }),
      new UsageError('symbol_limit_exceeded: extracted 3 symbols, limit is 2', {
        code: 'E_SYMBOL_LIMIT_EXCEEDED',
      }),
    );
  });
});
