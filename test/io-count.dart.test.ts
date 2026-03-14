import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canonicalStringify } from '../src/core/format/canonical-json.js';
import { countDartIoBySymbol } from '../src/rules/_shared/dart/io.js';
import { run as runFunctionMap } from '../src/rules/function_map/dart.js';
import { run as runMethodMap } from '../src/rules/method_map/dart.js';

describe('dart io counting', () => {
  it('aligns function and method keys with dart symbol maps', async () => {
    const source = [
      "Future<void> load() async { await File('a').readAsString(); }",
      'void save() { print("ok"); }',
      'class Client {',
      "  Future<void> fetch() async { await dio.get('/items'); }",
      "  void push() { stdout.write('ok'); }",
      '}',
      '',
    ].join('\n');

    const counts = countDartIoBySymbol({ source, language: 'dart' }, 'all');
    const functions = await runFunctionMap({ source, language: 'dart' });
    const methods = await runMethodMap({ source, language: 'dart' });

    assert.deepEqual(Object.keys(counts.functions), Object.keys(functions));
    assert.deepEqual(Object.keys(counts.methods), Object.keys(methods));
  });

  it('counts read patterns', () => {
    const source = [
      'Future<void> load() async {',
      "  await File('a').readAsString();",
      "  await http.get(Uri.parse('https://example.com'));",
      "  await dio.get('/items');",
      '}',
      'class ApiClient {',
      '  Future<void> fetch() async {',
      '    await File(path).openRead();',
      "    await client.get(Uri.parse('https://example.com'));",
      '  }',
      '}',
      '',
    ].join('\n');

    const output = countDartIoBySymbol({ source, language: 'dart' }, 'read');

    assert.deepEqual(output.functions, {
      load: 3,
    });
    assert.deepEqual(output.methods, {
      apiClientFetch: 2,
    });
  });

  it('counts write patterns', () => {
    const source = [
      'void save() {',
      "  File('a').writeAsString('ok');",
      "  print('done');",
      "  stdout.write('saved');",
      "  stdout.writeln('saved');",
      "  http.post(Uri.parse('https://example.com'));",
      "  http.put(Uri.parse('https://example.com'));",
      "  dio.patch('/items');",
      "  dio.post('/items');",
      '}',
      'class ApiClient {',
      '  Future<void> push() async {',
      '    await File(path).writeAsBytes(bytes);',
      "    await client.post(Uri.parse('https://example.com'));",
      '  }',
      '}',
      '',
    ].join('\n');

    const output = countDartIoBySymbol({ source, language: 'dart' }, 'write');

    assert.deepEqual(output.functions, {
      save: 8,
    });
    assert.deepEqual(output.methods, {
      apiClientPush: 2,
    });
  });

  it('io_calls_count equals read plus write per symbol and includes zeroes', () => {
    const source = [
      'Future<void> mixed() async {',
      "  await File('a').readAsBytes();",
      "  print('done');",
      '}',
      'void idle() {}',
      'class ApiClient {',
      '  Future<void> sync() async {',
      "    await dio.get('/items');",
      "    await dio.post('/items');",
      '  }',
      '  void noop() {}',
      '}',
      '',
    ].join('\n');

    const allCounts = countDartIoBySymbol({ source, language: 'dart' }, 'all');
    const readCounts = countDartIoBySymbol(
      { source, language: 'dart' },
      'read',
    );
    const writeCounts = countDartIoBySymbol(
      { source, language: 'dart' },
      'write',
    );

    assert.deepEqual(readCounts.functions, { idle: 0, mixed: 1 });
    assert.deepEqual(writeCounts.functions, { idle: 0, mixed: 1 });
    assert.deepEqual(allCounts.functions, { idle: 0, mixed: 2 });
    assert.deepEqual(readCounts.methods, {
      apiClientNoop: 0,
      apiClientSync: 1,
    });
    assert.deepEqual(writeCounts.methods, {
      apiClientNoop: 0,
      apiClientSync: 1,
    });
    assert.deepEqual(allCounts.methods, { apiClientNoop: 0, apiClientSync: 2 });
  });

  it('is deterministic across repeated runs', () => {
    const source = [
      'Future<void> load() async {',
      "  await File('a').readAsLines();",
      '}',
      'class ApiClient {',
      "  void push() { stdout.write('ok'); }",
      '}',
      '',
    ].join('\n');

    const first = countDartIoBySymbol({ source, language: 'dart' }, 'all');
    const second = countDartIoBySymbol({ source, language: 'dart' }, 'all');

    assert.equal(canonicalStringify(first), canonicalStringify(second));
  });
});
