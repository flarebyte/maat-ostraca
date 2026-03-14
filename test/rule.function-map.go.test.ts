import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canonicalStringify } from '../src/core/format/canonical-json.js';
import { run } from '../src/rules/function_map/go.js';

describe('rule function_map/go', () => {
  it('extracts top-level functions and excludes methods', async () => {
    const source = [
      'package sample',
      '',
      'func Charge(ctx context.Context, req ChargeRequest) error {',
      '  return nil',
      '}',
      '',
      'func Refund(req RefundRequest) (ChargeResponse, error) {',
      '  return ChargeResponse{}, nil',
      '}',
      '',
      'func (s *PaymentService) helper() {}',
      '',
    ].join('\n');

    const result = await run({ source, language: 'go' });

    assert.deepEqual(Object.keys(result), ['Charge', 'Refund']);
    assert.deepEqual(result.Charge.modifiers, []);
    assert.deepEqual(result.Charge.params, [
      'ctx context.Context',
      'req ChargeRequest',
    ]);
    assert.deepEqual(result.Charge.returns, ['error']);
    assert.deepEqual(result.Refund.returns, ['ChargeResponse', 'error']);
  });

  it('preserves and trims params and returns', async () => {
    const source = [
      'package sample',
      '',
      'func Build( ctx context.Context , req ChargeRequest ) ( Result , error ) {',
      '  return Result{}, nil',
      '}',
      '',
    ].join('\n');

    const result = await run({ source, language: 'go' });

    assert.deepEqual(result.Build.params, [
      'ctx context.Context',
      'req ChargeRequest',
    ]);
    assert.deepEqual(result.Build.returns, ['Result', 'error']);
  });

  it('is deterministic across repeated runs', async () => {
    const source = [
      'package sample',
      '',
      'func Alpha() error { return nil }',
      'func Beta(v int) (string, error) { return "", nil }',
      '',
    ].join('\n');

    const first = await run({ source, language: 'go' });
    const second = await run({ source, language: 'go' });

    assert.equal(canonicalStringify(first), canonicalStringify(second));
  });
});
