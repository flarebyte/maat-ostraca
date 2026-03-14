import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canonicalStringify } from '../src/core/format/canonical-json.js';
import { run } from '../src/rules/testcase_titles_list/go.js';

describe('rule testcase_titles_list/go', () => {
  it('includes t.Run, b.Run, raw literals, and excludes computed or top-level names', async () => {
    const source = [
      'package sample',
      '',
      'func TestDemo(t *testing.T) {',
      '  t.Run("case-a", func(t *testing.T) {})',
      '  t.Run(`case-b`, func(t *testing.T) {})',
      '  t.Run(name, func(t *testing.T) {})',
      '  t.Run(prefix + "x", func(t *testing.T) {})',
      '}',
      '',
      'func BenchmarkDemo(b *testing.B) {',
      '  b.Run("bench-a", func(b *testing.B) {})',
      '}',
      '',
      'func TestPlain(t *testing.T) {}',
      '',
    ].join('\n');

    const result = await run({ source, language: 'go' });

    assert.deepEqual(result, ['bench-a', 'case-a', 'case-b']);
  });

  it('dedupes and sorts deterministically', async () => {
    const source = [
      'package sample',
      '',
      'func TestDemo(t *testing.T) {',
      '  t.Run("zeta", func(t *testing.T) {})',
      '  t.Run("alpha", func(t *testing.T) {})',
      '  t.Run("zeta", func(t *testing.T) {})',
      '}',
      '',
    ].join('\n');

    const first = await run({ source, language: 'go' });
    const second = await run({ source, language: 'go' });

    assert.deepEqual(first, ['alpha', 'zeta']);
    assert.equal(canonicalStringify(first), canonicalStringify(second));
  });
});
