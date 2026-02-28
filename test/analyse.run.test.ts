import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { runAnalyse } from '../src/core/run-analyse.js';

const SOURCE = 'import z from "z";\nimport a from "a";\n\nconst value = 1;\n';

describe('runAnalyse orchestrator', () => {
  it('aggregates multiple rules keyed by deterministic rule order', async () => {
    const output = await runAnalyse({
      source: SOURCE,
      language: 'typescript',
      rules: ['import_files_list', 'file_metrics', 'code_hash'],
    });

    assert.deepEqual(Object.keys(output.rules), [
      'code_hash',
      'file_metrics',
      'import_files_list',
    ]);
  });

  it('sorts list outputs and returns stable file_metrics values', async () => {
    const output = await runAnalyse({
      source: SOURCE,
      language: 'typescript',
      rules: ['import_files_list', 'file_metrics'],
    });

    assert.deepEqual(output.rules.import_files_list, ['a', 'z']);
    assert.deepEqual(output.rules.file_metrics, {
      loc: 5,
      sloc: 3,
      tokens: 19,
      loops: 0,
      conditions: 0,
      cyclomaticComplexity: 1,
      cognitiveComplexity: 1,
      maxNestingDepth: 0,
    });
  });

  it('code_hash output is stable for known source input', async () => {
    const output = await runAnalyse({
      source: SOURCE,
      language: 'typescript',
      rules: ['code_hash'],
    });

    assert.deepEqual(output.rules.code_hash, {
      algorithm: 'sha256',
      file: '41b3579e2e4135333d41edacbb97113d360564c72f4cddef15c4d558a954dac9',
    });
  });
});
