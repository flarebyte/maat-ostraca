import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { run } from '../src/rules/file_metrics/typescript.js';

describe('rule file_metrics/typescript', () => {
  it('computes loc and sloc deterministically with blank lines', async () => {
    const source = 'const a = 1;\n\n  \nconst b = 2;\n';

    const result = await run({ source, language: 'typescript' });

    assert.equal(result.loc, 5);
    assert.equal(result.sloc, 2);
  });

  it('counts loops/conditions and computes cyclomatic complexity as documented', async () => {
    const source = [
      'for (let i = 0; i < 3; i++) {}',
      'for (const key in obj) {}',
      'for (const value of arr) {}',
      'while (flag) {}',
      'do {} while (next);',
      'if (a) {} else if (b) {}',
      'switch (x) { case 1: break; case 2: break; default: break; }',
      'const y = a ? b : c;',
      'try {} catch (error) {}',
    ].join('\n');

    const result = await run({ source, language: 'typescript' });

    assert.equal(result.loops, 5);
    assert.equal(result.conditions, 5);
    assert.equal(result.cyclomaticComplexity, 12);
    assert.equal(result.cognitiveComplexity, 12);
  });

  it('computes a stable max nesting depth approximation', async () => {
    const source = [
      'function demo() {',
      '  if (cond) {',
      '    while (run) {',
      '      for (let i = 0; i < 1; i++) {',
      '        doWork();',
      '      }',
      '    }',
      '  }',
      '}',
    ].join('\n');

    const result = await run({ source, language: 'typescript' });

    assert.equal(result.maxNestingDepth, 4);
  });

  it('returns zeros for empty source', async () => {
    const result = await run({ source: '', language: 'typescript' });

    assert.deepEqual(result, {
      loc: 0,
      sloc: 0,
      tokens: 0,
      loops: 0,
      conditions: 0,
      cyclomaticComplexity: 0,
      cognitiveComplexity: 0,
      maxNestingDepth: 0,
    });
  });
});
