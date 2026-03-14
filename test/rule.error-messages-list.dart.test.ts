import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { run } from '../src/rules/error_messages_list/dart.js';
import { expectDeterministicStringList } from './helpers.js';

describe('rule error_messages_list/dart', () => {
  it('includes explicit dart error/reporting calls and excludes non-literals', async () => {
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
      "  throw StateError(prefix + 'nope');",
      '  throw err;',
      '  print(err);',
      '  debugPrint(message);',
      '}',
      '',
    ].join('\n');

    const result = await run({ source, language: 'dart' });

    assert.deepEqual(result, [
      'argument fail',
      'debug fail',
      'exception fail',
      'flutter fail',
      'format fail',
      'print fail',
      'state fail',
    ]);
  });

  it('dedupes and sorts deterministically', async () => {
    const source = [
      'void demo() {',
      "  print('b');",
      "  throw Exception('a');",
      "  debugPrint('b');",
      '}',
      '',
    ].join('\n');

    await expectDeterministicStringList(
      () => run({ source, language: 'dart' }),
      ['a', 'b'],
    );
  });
});
