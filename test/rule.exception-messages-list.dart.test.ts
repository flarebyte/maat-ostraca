import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canonicalStringify } from '../src/core/format/canonical-json.js';
import { run } from '../src/rules/exception_messages_list/dart.js';

describe('rule exception_messages_list/dart', () => {
  it('includes only static-string throw messages', async () => {
    const source = [
      'void demo(dynamic err, String value) {',
      '  throw Exception("exception fail");',
      "  throw StateError('state fail');",
      "  throw ArgumentError('argument fail');",
      '  throw FlutterError("""flutter fail""");',
      "  throw FormatException('format fail');",
      '  print("print fail");',
      "  debugPrint('debug fail');",
      '  throw Exception("hello $value");',
      '  throw SomeError(message);',
      '  throw err;',
      '  rethrow;',
      '}',
      '',
    ].join('\n');

    const result = await run({ source, language: 'dart' });

    assert.deepEqual(result, [
      'argument fail',
      'exception fail',
      'flutter fail',
      'format fail',
      'state fail',
    ]);
  });

  it('dedupes and sorts deterministically', async () => {
    const source = [
      'void demo() {',
      "  throw Exception('b');",
      "  throw StateError('a');",
      "  throw ArgumentError('b');",
      '}',
      '',
    ].join('\n');

    const first = await run({ source, language: 'dart' });
    const second = await run({ source, language: 'dart' });

    assert.deepEqual(first, ['a', 'b']);
    assert.equal(canonicalStringify(first), canonicalStringify(second));
  });
});
