import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { run as runGo } from '../src/rules/code_hash/go.js';
import { run as runTypeScript } from '../src/rules/code_hash/typescript.js';
import {
  EXPECTED_EMPTY_CODE_HASH,
  EXPECTED_GO_CODE_HASH,
  EXPECTED_TYPESCRIPT_CODE_HASH,
  expectKnownCodeHashOutputs,
  registerCodeHashDiffShapeTests,
} from './helpers.js';

describe('rule code_hash/go', () => {
  it('hashes known go source to the expected sha256 hex digest', async () => {
    const source = 'package main\n\nfunc main() {}\n';

    const result = await runGo({
      source,
      language: 'go',
    });

    assert.deepEqual(result, EXPECTED_GO_CODE_HASH);
  });

  it('hashes empty source deterministically', async () => {
    const result = await runGo({
      source: '',
      language: 'go',
    });

    assert.deepEqual(result, EXPECTED_EMPTY_CODE_HASH);
  });

  it('keeps existing typescript code_hash output unchanged', async () => {
    await expectKnownCodeHashOutputs([
      {
        runRule: runTypeScript,
        input: { source: 'const a = 1;\n', language: 'typescript' },
        expected: EXPECTED_TYPESCRIPT_CODE_HASH,
      },
    ]);
  });

  registerCodeHashDiffShapeTests('file.go', 'go');
});
