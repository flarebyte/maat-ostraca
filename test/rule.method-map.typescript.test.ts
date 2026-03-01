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
    assert.deepEqual(result.paymentServiceCharge.modifiers, [
      'async',
      'public',
    ]);
    assert.equal(result.paymentServiceCharge.receiver, 'PaymentService');
    assert.equal(result.paymentServiceCharge.name, 'Charge');
    assert.deepEqual(result.paymentServiceCharge.params, ['amount: number']);
    assert.deepEqual(result.paymentServiceCharge.returns, ['Promise<void>']);
    assert.equal(result.paymentServiceCharge.returnCount, 1);
    assert.equal(result.paymentServiceCharge.ioCallsCount, 0);

    assert.deepEqual(result.paymentServicehelper.modifiers, [
      'private',
      'static',
    ]);
    assert.equal(result.paymentServicehelper.receiver, 'PaymentService');
    assert.equal(result.paymentServicehelper.name, 'helper');
    assert.deepEqual(result.paymentServicehelper.params, ['a: string']);
    assert.deepEqual(result.paymentServicehelper.returns, ['number']);
    assert.equal(result.paymentServicehelper.returnCount, 1);
  });
});
