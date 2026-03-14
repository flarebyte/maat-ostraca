import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { describe, it } from 'node:test';
import { canonicalStringify } from '../src/core/format/canonical-json.js';
import { run as runClassMap } from '../src/rules/class_map/dart.js';
import { run as runFunctionMap } from '../src/rules/function_map/dart.js';
import { run as runIoAll } from '../src/rules/io_calls_count/dart.js';
import { run as runIoRead } from '../src/rules/io_read_calls_count/dart.js';
import { run as runIoWrite } from '../src/rules/io_write_calls_count/dart.js';
import { run as runMethodMap } from '../src/rules/method_map/dart.js';

describe('dart symbol metrics + io enrichment', () => {
  it('enriches top-level functions with deterministic metrics, hash, and io counts', async () => {
    const loadCode = [
      'Future<int> load(bool flag) async {',
      '  if (flag) {',
      "    await File('a').readAsString();",
      '    return 1;',
      '  }',
      '  return 0;',
      '}',
    ].join('\n');
    const source = [loadCode, ''].join('\n');

    const result = await runFunctionMap({ source, language: 'dart' });

    assert.deepEqual(result.load.modifiers, ['async']);
    assert.deepEqual(result.load.params, ['bool flag']);
    assert.deepEqual(result.load.returns, ['Future<int>']);
    assert.equal(result.load.loc, 7);
    assert.equal(result.load.sloc, 7);
    assert.equal(result.load.loops, 0);
    assert.equal(result.load.conditions, 1);
    assert.equal(result.load.cyclomaticComplexity, 2);
    assert.equal(result.load.cognitiveComplexity, 2);
    assert.equal(result.load.maxNestingDepth, 2);
    assert.equal(result.load.returnCount, 2);
    assert.equal(result.load.ioCallsCount, 1);
    assert.equal(result.load.ioReadCallsCount, 1);
    assert.equal(result.load.ioWriteCallsCount, 0);
    assert.equal(
      result.load.sha256,
      createHash('sha256').update(loadCode, 'utf8').digest('hex'),
    );
    assert.equal(typeof result.load.tokens, 'number');
    assert.ok(result.load.tokens > 0);
  });

  it('enriches methods while preserving receiver normalization and io alignment', async () => {
    const source = [
      'class ApiClient {',
      '  Future<void> fetch() async {',
      "    await dio.get('/items');",
      '    return;',
      '  }',
      '',
      '  Future<void> push() async {',
      "    await dio.post('/items');",
      "    print('done');",
      '    return;',
      '  }',
      '}',
      '',
    ].join('\n');

    const result = await runMethodMap({ source, language: 'dart' });

    assert.equal(result.apiClientFetch.receiver, 'ApiClient');
    assert.equal(result.apiClientFetch.name, 'fetch');
    assert.equal(result.apiClientFetch.returnCount, 1);
    assert.equal(result.apiClientFetch.ioCallsCount, 1);
    assert.equal(result.apiClientFetch.ioReadCallsCount, 1);
    assert.equal(result.apiClientFetch.ioWriteCallsCount, 0);

    assert.equal(result.apiClientPush.receiver, 'ApiClient');
    assert.equal(result.apiClientPush.name, 'push');
    assert.equal(result.apiClientPush.returnCount, 1);
    assert.equal(result.apiClientPush.ioCallsCount, 2);
    assert.equal(result.apiClientPush.ioReadCallsCount, 0);
    assert.equal(result.apiClientPush.ioWriteCallsCount, 2);
  });

  it('computes class metrics and hash deterministically while preserving methodCount', async () => {
    const source = [
      'abstract class Box extends BaseBox implements Reader {',
      '  Box();',
      '  Future<void> load() async {',
      "    await File('a').readAsString();",
      '  }',
      '  static external String helper();',
      '}',
      '',
    ].join('\n');

    const result = await runClassMap({ source, language: 'dart' });

    assert.deepEqual(result.Box.modifiers, ['abstract']);
    assert.equal(result.Box.extends, 'BaseBox');
    assert.deepEqual(result.Box.implements, ['Reader']);
    assert.equal(result.Box.methodCount, 2);
    assert.equal(result.Box.loc, 7);
    assert.equal(result.Box.sloc, 7);
    assert.equal(typeof result.Box.tokens, 'number');
    assert.equal(result.Box.sha256.length, 64);
  });

  it('keeps embedded io counts aligned with standalone dart io rules', async () => {
    const source = [
      "Future<void> load() async { await File('a').readAsString(); print('ok'); }",
      'class ApiClient {',
      "  Future<void> sync() async { await dio.get('/items'); await dio.post('/items'); }",
      '}',
      '',
    ].join('\n');

    const functionMap = await runFunctionMap({ source, language: 'dart' });
    const methodMap = await runMethodMap({ source, language: 'dart' });
    const ioAll = (await runIoAll({ source, language: 'dart' })) as {
      functions: Record<string, number>;
      methods: Record<string, number>;
    };
    const ioRead = (await runIoRead({ source, language: 'dart' })) as {
      functions: Record<string, number>;
      methods: Record<string, number>;
    };
    const ioWrite = (await runIoWrite({ source, language: 'dart' })) as {
      functions: Record<string, number>;
      methods: Record<string, number>;
    };

    assert.equal(functionMap.load.ioCallsCount, ioAll.functions.load);
    assert.equal(functionMap.load.ioReadCallsCount, ioRead.functions.load);
    assert.equal(functionMap.load.ioWriteCallsCount, ioWrite.functions.load);
    assert.equal(
      methodMap.apiClientSync.ioCallsCount,
      ioAll.methods.apiClientSync,
    );
    assert.equal(
      methodMap.apiClientSync.ioReadCallsCount,
      ioRead.methods.apiClientSync,
    );
    assert.equal(
      methodMap.apiClientSync.ioWriteCallsCount,
      ioWrite.methods.apiClientSync,
    );
  });

  it('is deterministic across repeated runs', async () => {
    const source = [
      'Future<int> load(bool flag) async {',
      '  if (flag) {',
      '    return 1;',
      '  }',
      '  return 0;',
      '}',
      'class ApiClient {',
      "  Future<void> push() async { print('done'); }",
      '}',
      '',
    ].join('\n');

    const first = {
      function_map: await runFunctionMap({ source, language: 'dart' }),
      method_map: await runMethodMap({ source, language: 'dart' }),
      class_map: await runClassMap({ source, language: 'dart' }),
    };
    const second = {
      function_map: await runFunctionMap({ source, language: 'dart' }),
      method_map: await runMethodMap({ source, language: 'dart' }),
      class_map: await runClassMap({ source, language: 'dart' }),
    };

    assert.equal(canonicalStringify(first), canonicalStringify(second));
  });
});
