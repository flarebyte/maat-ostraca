import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canonicalStringify } from '../src/core/format/canonical-json.js';
import { countGoIoBySymbol } from '../src/rules/_shared/go/io.js';
import { run as runFunctionMap } from '../src/rules/function_map/go.js';
import { run as runMethodMap } from '../src/rules/method_map/go.js';

describe('go io counting', () => {
  it('aligns function and method keys with go symbol maps', async () => {
    const source = [
      'package sample',
      '',
      'func Load() { os.ReadFile("a") }',
      'func Save() { os.WriteFile("b", nil, 0o644) }',
      'type Store struct{}',
      'func (s *Store) Sync() { fmt.Println("ok") }',
      '',
    ].join('\n');

    const counts = countGoIoBySymbol({ source, language: 'go' }, 'all');
    const functions = await runFunctionMap({ source, language: 'go' });
    const methods = await runMethodMap({ source, language: 'go' });

    assert.deepEqual(Object.keys(counts.functions), Object.keys(functions));
    assert.deepEqual(Object.keys(counts.methods), Object.keys(methods));
  });

  it('counts read patterns', () => {
    const source = [
      'package sample',
      '',
      'func Load() {',
      '  os.ReadFile("a")',
      '  io.ReadAll(reader)',
      '  http.Get("https://example.com")',
      '}',
      'type Client struct{}',
      'func (c *Client) ReadRemote() {',
      '  stream.Read(buf)',
      '}',
      '',
    ].join('\n');

    const output = countGoIoBySymbol({ source, language: 'go' }, 'read');

    assert.deepEqual(output.functions, {
      Load: 3,
    });
    assert.deepEqual(output.methods, {
      clientReadRemote: 1,
    });
  });

  it('counts write patterns', () => {
    const source = [
      'package sample',
      '',
      'func Save() {',
      '  os.WriteFile("a", data, 0o644)',
      '  fmt.Print("ok")',
      '  fmt.Printf("%s", "ok")',
      '  log.Println("done")',
      '  http.Post("https://example.com", "text/plain", body)',
      '}',
      'type Client struct{}',
      'func (c Client) Flush() {',
      '  stream.Write(buf)',
      '}',
      '',
    ].join('\n');

    const output = countGoIoBySymbol({ source, language: 'go' }, 'write');

    assert.deepEqual(output.functions, {
      Save: 5,
    });
    assert.deepEqual(output.methods, {
      clientFlush: 1,
    });
  });

  it('io_calls_count equals read plus write per symbol and includes zeroes', () => {
    const source = [
      'package sample',
      '',
      'func Mixed() {',
      '  os.ReadFile("a")',
      '  fmt.Println("ok")',
      '}',
      'func Empty() {',
      '}',
      'type Client struct{}',
      'func (c *Client) Sync() {',
      '  io.ReadAll(reader)',
      '  stream.Write(buf)',
      '}',
      '',
    ].join('\n');

    const allCounts = countGoIoBySymbol({ source, language: 'go' }, 'all');
    const readCounts = countGoIoBySymbol({ source, language: 'go' }, 'read');
    const writeCounts = countGoIoBySymbol({ source, language: 'go' }, 'write');

    assert.deepEqual(readCounts.functions, { Empty: 0, Mixed: 1 });
    assert.deepEqual(writeCounts.functions, { Empty: 0, Mixed: 1 });
    assert.deepEqual(allCounts.functions, { Empty: 0, Mixed: 2 });
    assert.deepEqual(readCounts.methods, { clientSync: 1 });
    assert.deepEqual(writeCounts.methods, { clientSync: 1 });
    assert.deepEqual(allCounts.methods, { clientSync: 2 });
  });

  it('is deterministic across repeated runs', () => {
    const source = [
      'package sample',
      '',
      'func Load() { os.ReadFile("a") }',
      'type Store struct{}',
      'func (s *Store) Save() { fmt.Println("ok") }',
      '',
    ].join('\n');

    const first = countGoIoBySymbol({ source, language: 'go' }, 'all');
    const second = countGoIoBySymbol({ source, language: 'go' }, 'all');

    assert.equal(canonicalStringify(first), canonicalStringify(second));
  });
});
