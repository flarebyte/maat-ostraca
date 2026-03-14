import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canonicalStringify } from '../src/core/format/canonical-json.js';
import { run as runInterfaceMap } from '../src/rules/interface_map/dart.js';
import { run as runInterfacesCodeMap } from '../src/rules/interfaces_code_map/dart.js';

describe('rule interface_map/dart + interfaces_code_map/dart', () => {
  it('extracts abstract classes only, with extends and abstract methods sorted', async () => {
    const source = [
      'abstract class Reader {',
      '  String read(String id);',
      '}',
      '',
      'abstract class PaymentProvider extends Reader implements Logger, Chargeable {',
      '  Future<void> charge(String id);',
      '  String format(int x);',
      '  void withBody() {}',
      '}',
      '',
      'class Worker extends Reader {',
      '  String read(String id) => id;',
      '}',
      '',
    ].join('\n');

    const result = await runInterfaceMap({ source, language: 'dart' });

    assert.deepEqual(Object.keys(result), ['PaymentProvider', 'Reader']);
    assert.deepEqual(result.PaymentProvider, {
      modifiers: ['abstract'],
      extends: ['Chargeable', 'Logger', 'Reader'],
      methods: ['Future<void> charge(String id)', 'String format(int x)'],
    });
    assert.deepEqual(result.Reader, {
      modifiers: ['abstract'],
      extends: [],
      methods: ['String read(String id)'],
    });
  });

  it('captures exact abstract class declaration text and preserves formatting', async () => {
    const source = [
      'abstract class Reader {',
      '\tString read(String id);',
      '}',
      '',
    ].join('\n');

    const result = await runInterfacesCodeMap({ source, language: 'dart' });

    assert.equal(
      result.Reader,
      ['abstract class Reader {', '\tString read(String id);', '}'].join('\n'),
    );
  });

  it('is deterministic across repeated runs', async () => {
    const source = [
      'abstract class Reader {',
      '  String read(String id);',
      '}',
      '',
      'abstract class PaymentProvider extends Reader implements Logger {',
      '  Future<void> charge(String id);',
      '}',
      '',
    ].join('\n');

    const first = await runInterfaceMap({ source, language: 'dart' });
    const second = await runInterfaceMap({ source, language: 'dart' });

    assert.equal(canonicalStringify(first), canonicalStringify(second));
  });
});
