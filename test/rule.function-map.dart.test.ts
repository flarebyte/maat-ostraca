import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canonicalStringify } from '../src/core/format/canonical-json.js';
import { run } from '../src/rules/function_map/dart.js';

describe('rule function_map/dart', () => {
  it('extracts top-level functions and excludes methods', async () => {
    const source = [
      'Future<void> boot(BuildContext context) async {',
      '  print(context);',
      '}',
      '',
      'external String lookup(String id);',
      '',
      'class PaymentService {',
      '  void charge(String id) {}',
      '}',
      '',
    ].join('\n');

    const result = await run({ source, language: 'dart' });

    assert.deepEqual(Object.keys(result), ['boot', 'lookup']);
    assert.deepEqual(result.boot.modifiers, ['async']);
    assert.deepEqual(result.boot.params, ['BuildContext context']);
    assert.deepEqual(result.boot.returns, ['Future<void>']);
    assert.deepEqual(result.lookup.modifiers, ['external']);
    assert.deepEqual(result.lookup.params, ['String id']);
    assert.deepEqual(result.lookup.returns, ['String']);
  });

  it('preserves and trims params and returns', async () => {
    const source = [
      'Future<String> build(',
      '  BuildContext context,',
      '  { required String id, int count = 0 },',
      ') async {',
      "  return '$id:$count';",
      '}',
      '',
    ].join('\n');

    const result = await run({ source, language: 'dart' });

    assert.deepEqual(result.build.params, [
      'BuildContext context',
      'required String id',
      'int count = 0',
    ]);
    assert.deepEqual(result.build.returns, ['Future<String>']);
  });

  it('is deterministic across repeated runs', async () => {
    const source = [
      'void alpha() {}',
      'external Future<void> beta();',
      '',
    ].join('\n');

    const first = await run({ source, language: 'dart' });
    const second = await run({ source, language: 'dart' });

    assert.equal(canonicalStringify(first), canonicalStringify(second));
  });
});
