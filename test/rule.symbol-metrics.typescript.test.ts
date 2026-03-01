import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { run as runFunctionMap } from '../src/rules/function_map/typescript.js';
import { run as runIoAll } from '../src/rules/io_calls_count/typescript.js';
import { run as runIoRead } from '../src/rules/io_read_calls_count/typescript.js';
import { run as runIoWrite } from '../src/rules/io_write_calls_count/typescript.js';
import { run as runMethodMap } from '../src/rules/method_map/typescript.js';

describe('symbol metrics + io enrichment', () => {
  it('computes deterministic metrics fields on functions and methods', async () => {
    const source = [
      'function alpha() {',
      '  if (flag) {',
      '    return fs.readFileSync("a", "utf8").length;',
      '  }',
      '  return 0;',
      '}',
      'class Box {',
      '  Save() {',
      '    fs.writeFileSync("x", "1");',
      '    return 1;',
      '  }',
      '}',
    ].join('\n');

    const functionMap = await runFunctionMap({
      source,
      language: 'typescript',
    });
    const methodMap = await runMethodMap({ source, language: 'typescript' });

    assert.equal(functionMap.alpha.returnCount, 2);
    assert.equal(functionMap.alpha.loops, 0);
    assert.equal(functionMap.alpha.conditions, 1);
    assert.equal(functionMap.alpha.cyclomaticComplexity, 2);
    assert.equal(functionMap.alpha.cognitiveComplexity, 2);
    assert.equal(functionMap.alpha.maxNestingDepth, 2);
    assert.equal(typeof functionMap.alpha.tokens, 'number');
    assert.equal(functionMap.alpha.sha256.length, 64);

    assert.equal(methodMap.boxSave.returnCount, 1);
    assert.equal(methodMap.boxSave.ioWriteCallsCount, 1);
  });

  it('attaches io counts consistently with io_* rules', async () => {
    const source = [
      'function alpha() { fetch("/a"); axios.post("/a", {}); }',
      'class S { Save() { fs.readFileSync("a","utf8"); process.stdout.write("x"); } }',
    ].join('\n');

    const functionMap = await runFunctionMap({
      source,
      language: 'typescript',
    });
    const methodMap = await runMethodMap({ source, language: 'typescript' });
    const ioAll = (await runIoAll({ source, language: 'typescript' })) as {
      functions: Record<string, number>;
      methods: Record<string, number>;
    };
    const ioRead = (await runIoRead({ source, language: 'typescript' })) as {
      functions: Record<string, number>;
      methods: Record<string, number>;
    };
    const ioWrite = (await runIoWrite({ source, language: 'typescript' })) as {
      functions: Record<string, number>;
      methods: Record<string, number>;
    };

    assert.equal(functionMap.alpha.ioCallsCount, ioAll.functions.alpha);
    assert.equal(functionMap.alpha.ioReadCallsCount, ioRead.functions.alpha);
    assert.equal(functionMap.alpha.ioWriteCallsCount, ioWrite.functions.alpha);

    assert.equal(methodMap.sSave.ioCallsCount, ioAll.methods.sSave);
    assert.equal(methodMap.sSave.ioReadCallsCount, ioRead.methods.sSave);
    assert.equal(methodMap.sSave.ioWriteCallsCount, ioWrite.methods.sSave);
  });
});
