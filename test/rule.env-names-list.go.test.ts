import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canonicalStringify } from '../src/core/format/canonical-json.js';
import { run } from '../src/rules/env_names_list/go.js';

describe('rule env_names_list/go', () => {
  it('includes os.Getenv, os.LookupEnv, and raw literals while excluding non-literals', async () => {
    const source = [
      'package sample',
      '',
      'func demo(name string) {',
      '  _ = os.Getenv("DB_HOST")',
      '  _, _ = os.LookupEnv(`API_KEY`)',
      '  _ = os.Getenv(name)',
      '  _ = os.LookupEnv(prefix + "X")',
      '  _ = os.Getenv(fmt.Sprintf("%s", name))',
      '}',
      '',
    ].join('\n');

    const result = await run({ source, language: 'go' });

    assert.deepEqual(result, ['API_KEY', 'DB_HOST']);
  });

  it('dedupes and sorts deterministically', async () => {
    const source = [
      'package sample',
      '',
      'func demo() {',
      '  _ = os.Getenv("ZETA")',
      '  _ = os.LookupEnv("ALPHA")',
      '  _ = os.Getenv("ALPHA")',
      '}',
      '',
    ].join('\n');

    const first = await run({ source, language: 'go' });
    const second = await run({ source, language: 'go' });

    assert.deepEqual(first, ['ALPHA', 'ZETA']);
    assert.equal(canonicalStringify(first), canonicalStringify(second));
  });
});
