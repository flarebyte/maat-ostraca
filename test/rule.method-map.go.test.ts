import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canonicalStringify } from '../src/core/format/canonical-json.js';
import { run } from '../src/rules/method_map/go.js';

describe('rule method_map/go', () => {
  it('extracts methods with pointer and value receivers', async () => {
    const source = [
      'package sample',
      '',
      'func (s *PaymentService) Charge(ctx context.Context, req ChargeRequest) error {',
      '  return nil',
      '}',
      '',
      'func (svc PaymentService) Refund(req RefundRequest) (ChargeResponse, error) {',
      '  return ChargeResponse{}, nil',
      '}',
      '',
      'func helper() {}',
      '',
    ].join('\n');

    const result = await run({ source, language: 'go' });

    assert.deepEqual(Object.keys(result), [
      'paymentServiceCharge',
      'paymentServiceRefund',
    ]);
    assert.deepEqual(result.paymentServiceCharge.modifiers, []);
    assert.equal(result.paymentServiceCharge.receiver, 'PaymentService');
    assert.equal(result.paymentServiceCharge.name, 'Charge');
    assert.deepEqual(result.paymentServiceCharge.params, [
      'ctx context.Context',
      'req ChargeRequest',
    ]);
    assert.deepEqual(result.paymentServiceCharge.returns, ['error']);
    assert.equal(result.paymentServiceRefund.receiver, 'PaymentService');
    assert.equal(result.paymentServiceRefund.name, 'Refund');
    assert.deepEqual(result.paymentServiceRefund.returns, [
      'ChargeResponse',
      'error',
    ]);
  });

  it('normalizes receiver and derives keys as specified', async () => {
    const source = [
      'package sample',
      '',
      'func (svc *PaymentService) Charge() {}',
      'func (svc PaymentService) Refund() {}',
      '',
    ].join('\n');

    const result = await run({ source, language: 'go' });

    assert.ok('paymentServiceCharge' in result);
    assert.ok('paymentServiceRefund' in result);
  });

  it('extracts params and returns deterministically', async () => {
    const source = [
      'package sample',
      '',
      'func (svc *PaymentService) Run( ctx context.Context , req ChargeRequest ) ( Result , error ) {',
      '  return Result{}, nil',
      '}',
      '',
    ].join('\n');

    const first = await run({ source, language: 'go' });
    const second = await run({ source, language: 'go' });

    assert.deepEqual(first.paymentServiceRun.params, [
      'ctx context.Context',
      'req ChargeRequest',
    ]);
    assert.deepEqual(first.paymentServiceRun.returns, ['Result', 'error']);
    assert.equal(canonicalStringify(first), canonicalStringify(second));
  });
});
