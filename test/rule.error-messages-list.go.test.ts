import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canonicalStringify } from '../src/core/format/canonical-json.js';
import { run } from '../src/rules/error_messages_list/go.js';

describe('rule error_messages_list/go', () => {
  it('includes explicit go error/reporting calls and excludes non-literals', async () => {
    const source = [
      'package sample',
      '',
      'func demo(err error, value string) {',
      '  errors.New("new fail")',
      '  fmt.Errorf(`format fail`)',
      '  log.Print("print fail")',
      '  log.Printf("printf fail: %s", value)',
      '  log.Println("println fail")',
      '  panic("panic fail")',
      '  errors.New(prefix + "nope")',
      '  fmt.Errorf(err.Error())',
      '  log.Print(err)',
      '  panic(err)',
      '}',
      '',
    ].join('\n');

    const result = await run({ source, language: 'go' });

    assert.deepEqual(result, [
      'format fail',
      'new fail',
      'panic fail',
      'print fail',
      'printf fail: %s',
      'println fail',
    ]);
  });

  it('dedupes and sorts deterministically', async () => {
    const source = [
      'package sample',
      '',
      'func demo() {',
      '  errors.New("b")',
      '  log.Print("a")',
      '  panic("b")',
      '}',
      '',
    ].join('\n');

    const first = await run({ source, language: 'go' });
    const second = await run({ source, language: 'go' });

    assert.deepEqual(first, ['a', 'b']);
    assert.equal(canonicalStringify(first), canonicalStringify(second));
  });
});
