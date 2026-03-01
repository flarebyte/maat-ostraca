import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { run } from '../src/rules/method_map/typescript.js';

describe('rule method_map/typescript', () => {
  it('extracts methods with receiver key and ignores computed names', async () => {
    const source = [
      'class PaymentService {',
      '  public async Charge(amount: number): Promise<void> { return; }',
      '  private static helper(a: string): number { return 1; }',
      "  ['computed']() {}",
      '}',
    ].join('\n');

    const result = await run({ source, language: 'typescript' });

    assert.deepEqual(Object.keys(result), [
      'paymentServiceCharge',
      'paymentServicehelper',
    ]);
    assert.deepEqual(result.paymentServiceCharge, {
      modifiers: ['async', 'public'],
      receiver: 'PaymentService',
      name: 'Charge',
      params: ['amount: number'],
      returns: ['Promise<void>'],
    });
    assert.deepEqual(result.paymentServicehelper, {
      modifiers: ['private', 'static'],
      receiver: 'PaymentService',
      name: 'helper',
      params: ['a: string'],
      returns: ['number'],
    });
  });
});
