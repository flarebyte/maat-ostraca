import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { UsageError } from '../src/core/errors/index.js';
import { dispatchRule } from '../src/rules/dispatch.js';

describe('rules.dispatch', () => {
  it('resolves known rule-language module', async () => {
    const run = await dispatchRule('code_hash', 'typescript');
    const value = (await run({
      source: 'const a = 1;\n',
      language: 'typescript',
    })) as { algorithm: string; file: string };

    assert.equal(value.algorithm, 'sha256');
    assert.equal(
      value.file,
      'b79b14bd2584dd52b0f0ef042a2a4f104cda48330500e12237737cc51fbda43d',
    );
  });

  it('fails deterministically for missing implementation', async () => {
    await assert.rejects(
      async () => dispatchRule('import_functions_list', 'typescript'),
      new UsageError(
        'rule "import_functions_list" is not implemented for language "typescript"',
      ),
    );
  });
});
