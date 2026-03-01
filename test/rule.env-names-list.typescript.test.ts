import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { run } from '../src/rules/env_names_list/typescript.js';

describe('rule env_names_list/typescript', () => {
  it('includes dot and bracket literal accesses including optional chaining', async () => {
    const source = [
      'const a = process.env.DB_HOST;',
      "const b = process.env['API_KEY'];",
      'const c = process.env["API_KEY"];',
      'const d = process.env[`CACHE_TTL`];',
      'const e = process.env?.PORT;',
      "const f = process.env?.['PORT'];",
      'const g = process?.env?.SERVICE_URL;',
      'const name = "DYNAMIC";',
      'const suffix = "X";',
      'const bad1 = process.env[name];',
      'const bad2 = process.env[`FOO_' + '$' + '{suffix}`];',
      'const bad3 = process.env["BAR" + suffix];',
      'void a; void b; void c; void d; void e; void f; void g;',
      'void bad1; void bad2; void bad3;',
    ].join('\n');

    const result = await run({ source, language: 'typescript' });

    assert.deepEqual(result, [
      'API_KEY',
      'CACHE_TTL',
      'DB_HOST',
      'PORT',
      'SERVICE_URL',
    ]);
  });

  it('dedupes and sorts deterministically', async () => {
    const source = [
      'const a = process.env.ZETA;',
      'const b = process.env.ALPHA;',
      'const c = process.env?.ZETA;',
      "const d = process.env['ALPHA'];",
      'void a; void b; void c; void d;',
    ].join('\n');

    const result = await run({ source, language: 'typescript' });

    assert.deepEqual(result, ['ALPHA', 'ZETA']);
  });
});
