import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { run } from '../src/rules/class_map/typescript.js';

describe('rule class_map/typescript', () => {
  it('extracts class modifiers, extends/implements and methodCount', async () => {
    const source = [
      'export abstract class PaymentService extends BaseService implements IChargeable, ILogger {',
      '  public Charge(): void {}',
      '  private static helper(): number { return 1; }',
      "  ['computed']() {}",
      '}',
      'class Worker {}',
    ].join('\n');

    const result = await run({ source, language: 'typescript' });

    assert.deepEqual(Object.keys(result), ['PaymentService', 'Worker']);
    assert.deepEqual(result.PaymentService.modifiers, ['abstract', 'export']);
    assert.equal(result.PaymentService.extends, 'BaseService');
    assert.deepEqual(result.PaymentService.implements, [
      'IChargeable',
      'ILogger',
    ]);
    assert.equal(result.PaymentService.methodCount, 2);
    assert.equal(typeof result.PaymentService.sha256, 'string');
    assert.equal(result.PaymentService.sha256.length, 64);
    assert.equal(typeof result.PaymentService.tokens, 'number');

    assert.deepEqual(result.Worker.modifiers, []);
    assert.equal(result.Worker.methodCount, 0);
    assert.equal(result.Worker.loc, 1);
  });
});
