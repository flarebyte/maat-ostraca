import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { describe, it } from 'node:test';
import { canonicalStringify } from '../src/core/format/canonical-json.js';
import { run as runFunctionMap } from '../src/rules/function_map/go.js';
import { run as runDiffIoAll } from '../src/rules/io_calls_count/go.js';
import { run as runDiffIoRead } from '../src/rules/io_read_calls_count/go.js';
import { run as runDiffIoWrite } from '../src/rules/io_write_calls_count/go.js';
import { run as runMethodMap } from '../src/rules/method_map/go.js';

describe('go symbol metrics + io enrichment', () => {
  it('enriches top-level functions with deterministic metrics, hash, and io counts', async () => {
    const alphaCode = [
      'func Alpha(flag bool) error {',
      '  if flag {',
      '    os.ReadFile("a")',
      '    return nil',
      '  }',
      '  return nil',
      '}',
    ].join('\n');
    const source = ['package sample', '', alphaCode, ''].join('\n');

    const result = await runFunctionMap({ source, language: 'go' });

    assert.deepEqual(result.Alpha.modifiers, []);
    assert.deepEqual(result.Alpha.params, ['flag bool']);
    assert.deepEqual(result.Alpha.returns, ['error']);
    assert.equal(result.Alpha.loc, 7);
    assert.equal(result.Alpha.sloc, 7);
    assert.equal(result.Alpha.loops, 0);
    assert.equal(result.Alpha.conditions, 1);
    assert.equal(result.Alpha.cyclomaticComplexity, 2);
    assert.equal(result.Alpha.cognitiveComplexity, 2);
    assert.equal(result.Alpha.maxNestingDepth, 2);
    assert.equal(result.Alpha.returnCount, 2);
    assert.equal(result.Alpha.ioCallsCount, 1);
    assert.equal(result.Alpha.ioReadCallsCount, 1);
    assert.equal(result.Alpha.ioWriteCallsCount, 0);
    assert.equal(
      result.Alpha.sha256,
      createHash('sha256').update(alphaCode, 'utf8').digest('hex'),
    );
    assert.equal(typeof result.Alpha.tokens, 'number');
    assert.ok(result.Alpha.tokens > 0);
  });

  it('enriches methods while preserving receiver normalization and key derivation', async () => {
    const source = [
      'package sample',
      '',
      'type Service struct{}',
      '',
      'func (svc *Service) Save(items []string) error {',
      '  for range items {',
      '    fmt.Println("saved")',
      '  }',
      '  return nil',
      '}',
      '',
      'func (svc Service) Load() error {',
      '  os.ReadFile("a")',
      '  return nil',
      '}',
      '',
    ].join('\n');

    const result = await runMethodMap({ source, language: 'go' });

    assert.equal(result.serviceSave.receiver, 'Service');
    assert.equal(result.serviceSave.name, 'Save');
    assert.equal(result.serviceSave.loops, 1);
    assert.equal(result.serviceSave.conditions, 0);
    assert.equal(result.serviceSave.returnCount, 1);
    assert.equal(result.serviceSave.ioCallsCount, 1);
    assert.equal(result.serviceSave.ioReadCallsCount, 0);
    assert.equal(result.serviceSave.ioWriteCallsCount, 1);

    assert.equal(result.serviceLoad.receiver, 'Service');
    assert.equal(result.serviceLoad.name, 'Load');
    assert.equal(result.serviceLoad.loops, 0);
    assert.equal(result.serviceLoad.returnCount, 1);
    assert.equal(result.serviceLoad.ioCallsCount, 1);
    assert.equal(result.serviceLoad.ioReadCallsCount, 1);
    assert.equal(result.serviceLoad.ioWriteCallsCount, 0);
  });

  it('keeps embedded io counts aligned with standalone go io rules', async () => {
    const source = [
      'package sample',
      '',
      'type Client struct{}',
      '',
      'func Load() {',
      '  os.ReadFile("a")',
      '  fmt.Println("ok")',
      '}',
      '',
      'func (c *Client) Sync() {',
      '  io.ReadAll(reader)',
      '  stream.Write(buf)',
      '}',
      '',
    ].join('\n');

    const functionMap = await runFunctionMap({ source, language: 'go' });
    const methodMap = await runMethodMap({ source, language: 'go' });
    const ioAll = (await runDiffIoAll({ source, language: 'go' })) as {
      functions: Record<string, number>;
      methods: Record<string, number>;
    };
    const ioRead = (await runDiffIoRead({ source, language: 'go' })) as {
      functions: Record<string, number>;
      methods: Record<string, number>;
    };
    const ioWrite = (await runDiffIoWrite({ source, language: 'go' })) as {
      functions: Record<string, number>;
      methods: Record<string, number>;
    };

    assert.equal(functionMap.Load.ioCallsCount, ioAll.functions.Load);
    assert.equal(functionMap.Load.ioReadCallsCount, ioRead.functions.Load);
    assert.equal(functionMap.Load.ioWriteCallsCount, ioWrite.functions.Load);
    assert.equal(methodMap.clientSync.ioCallsCount, ioAll.methods.clientSync);
    assert.equal(
      methodMap.clientSync.ioReadCallsCount,
      ioRead.methods.clientSync,
    );
    assert.equal(
      methodMap.clientSync.ioWriteCallsCount,
      ioWrite.methods.clientSync,
    );
  });

  it('is deterministic across repeated runs', async () => {
    const source = [
      'package sample',
      '',
      'type Service struct{}',
      '',
      'func Alpha() error {',
      '  if ok {',
      '    return nil',
      '  }',
      '  return nil',
      '}',
      '',
      'func (svc *Service) Save() {',
      '  fmt.Println("ok")',
      '}',
      '',
    ].join('\n');

    const first = {
      function_map: await runFunctionMap({ source, language: 'go' }),
      method_map: await runMethodMap({ source, language: 'go' }),
    };
    const second = {
      function_map: await runFunctionMap({ source, language: 'go' }),
      method_map: await runMethodMap({ source, language: 'go' }),
    };

    assert.equal(canonicalStringify(first), canonicalStringify(second));
  });
});
