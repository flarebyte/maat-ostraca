import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { run } from '../src/rules/class_map/dart.js';
import { expectCanonicalDeterminism } from './helpers.js';

describe('rule class_map/dart', () => {
  it('extracts classes, extends/implements, modifiers, and methodCount', async () => {
    const source = [
      'abstract class PaymentService extends BaseService implements Logger, Chargeable {',
      '  PaymentService();',
      '  Future<void> charge(String id) async {}',
      '  static external String helper();',
      "  String get label => 'x';",
      '}',
      '',
      'class Worker {}',
      '',
    ].join('\n');

    const result = await run({ source, language: 'dart' });

    assert.deepEqual(Object.keys(result), ['PaymentService', 'Worker']);
    assert.deepEqual(result.PaymentService.modifiers, ['abstract']);
    assert.equal(result.PaymentService.extends, 'BaseService');
    assert.deepEqual(result.PaymentService.implements, [
      'Chargeable',
      'Logger',
    ]);
    assert.equal(result.PaymentService.methodCount, 2);
    assert.equal(typeof result.PaymentService.loc, 'number');
    assert.equal(typeof result.PaymentService.sha256, 'string');
    assert.deepEqual(result.Worker.modifiers, []);
    assert.equal(result.Worker.methodCount, 0);
    assert.equal(typeof result.Worker.tokens, 'number');
  });

  it('is deterministic across repeated runs', async () => {
    const source = [
      'abstract class A implements C, B {',
      '  static external String helper();',
      '}',
      '',
    ].join('\n');

    await expectCanonicalDeterminism(() => run({ source, language: 'dart' }));
  });
});
