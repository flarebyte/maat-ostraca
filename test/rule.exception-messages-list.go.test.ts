import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { run } from '../src/rules/exception_messages_list/go.js';
import { expectDeterministicStringList } from './helpers.js';

describe('rule exception_messages_list/go', () => {
  it('includes only static-string panic messages', async () => {
    const source = [
      'package sample',
      '',
      'func demo(err error, value string) {',
      '  panic("literal panic")',
      '  panic(`raw panic`)',
      '  panic(err)',
      '  panic(fmt.Errorf("wrapped"))',
      '  panic(prefix + value)',
      '}',
      '',
    ].join('\n');

    const result = await run({ source, language: 'go' });

    assert.deepEqual(result, ['literal panic', 'raw panic']);
  });

  it('dedupes and sorts deterministically', async () => {
    const source = [
      'package sample',
      '',
      'func demo() {',
      '  panic("b")',
      '  panic("a")',
      '  panic("b")',
      '}',
      '',
    ].join('\n');

    await expectDeterministicStringList(
      () => run({ source, language: 'go' }),
      ['a', 'b'],
    );
  });
});
