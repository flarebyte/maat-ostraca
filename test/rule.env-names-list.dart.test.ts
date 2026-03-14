import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canonicalStringify } from '../src/core/format/canonical-json.js';
import { run } from '../src/rules/env_names_list/dart.js';

describe('rule env_names_list/dart', () => {
  it('includes Platform.environment index access and containsKey while excluding non-literals', async () => {
    const source = [
      'void demo(String key, String suffix) {',
      "  final host = Platform.environment['DB_HOST'];",
      '  final user = Platform.environment["DB_USER"]?.trim();',
      "  final hasToken = Platform.environment.containsKey('API_TOKEN');",
      '  final missing = Platform.environment[key];',
      "  final combined = Platform.environment['APP_' + suffix];",
      '  final dynamicName = Platform.environment["APP_$suffix"];',
      '  final hasDynamic = Platform.environment.containsKey(key);',
      '}',
      '',
    ].join('\n');

    const result = await run({ source, language: 'dart' });

    assert.deepEqual(result, ['API_TOKEN', 'DB_HOST', 'DB_USER']);
  });

  it('dedupes and sorts deterministically', async () => {
    const source = [
      'void demo() {',
      "  Platform.environment['ZETA'];",
      '  Platform.environment["ALPHA"];',
      "  Platform.environment.containsKey('ALPHA');",
      '}',
      '',
    ].join('\n');

    const first = await run({ source, language: 'dart' });
    const second = await run({ source, language: 'dart' });

    assert.deepEqual(first, ['ALPHA', 'ZETA']);
    assert.equal(canonicalStringify(first), canonicalStringify(second));
  });
});
