import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { run } from '../src/rules/method_map/dart.js';
import { expectCanonicalDeterminism } from './helpers.js';

describe('rule method_map/dart', () => {
  it('extracts class methods and excludes constructors', async () => {
    const source = [
      'class PaymentService {',
      '  PaymentService();',
      '  PaymentService.named();',
      '  Future<void> charge(String id) async {',
      '    print(id);',
      '  }',
      '  static external String helper(int count);',
      '}',
      '',
    ].join('\n');

    const result = await run({ source, language: 'dart' });

    assert.deepEqual(Object.keys(result), [
      'paymentServiceCharge',
      'paymentServiceHelper',
    ]);
    assert.equal(result.paymentServiceCharge.receiver, 'PaymentService');
    assert.equal(result.paymentServiceCharge.name, 'charge');
    assert.deepEqual(result.paymentServiceCharge.modifiers, ['async']);
    assert.deepEqual(result.paymentServiceCharge.params, ['String id']);
    assert.deepEqual(result.paymentServiceCharge.returns, ['Future<void>']);
    assert.deepEqual(result.paymentServiceHelper.modifiers, [
      'external',
      'static',
    ]);
  });

  it('normalizes receiver and derives keys as specified', async () => {
    const source = [
      'class ApiClient {',
      '  Future<String> fetch() async => "ok";',
      '}',
      '',
    ].join('\n');

    const result = await run({ source, language: 'dart' });

    assert.ok('apiClientFetch' in result);
    assert.equal(result.apiClientFetch.receiver, 'ApiClient');
    assert.equal(result.apiClientFetch.name, 'fetch');
  });

  it('is deterministic across repeated runs', async () => {
    const source = [
      'class Store {',
      '  static external String helper();',
      '  Future<void> save() async {}',
      '}',
      '',
    ].join('\n');

    await expectCanonicalDeterminism(() => run({ source, language: 'dart' }));
  });
});
