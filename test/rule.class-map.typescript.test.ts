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
    assert.deepEqual(result.PaymentService, {
      modifiers: ['abstract', 'export'],
      extends: 'BaseService',
      implements: ['IChargeable', 'ILogger'],
      methodCount: 2,
    });
    assert.deepEqual(result.Worker, {
      modifiers: [],
      methodCount: 0,
    });
  });
});
