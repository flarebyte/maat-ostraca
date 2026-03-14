import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { run as runDart } from '../src/rules/code_hash/dart.js';
import { run as runGo } from '../src/rules/code_hash/go.js';
import { run as runTypeScript } from '../src/rules/code_hash/typescript.js';
import {
  EXPECTED_EMPTY_CODE_HASH,
  EXPECTED_GO_CODE_HASH,
  EXPECTED_TYPESCRIPT_CODE_HASH,
  expectKnownCodeHashOutputs,
  registerCodeHashDiffShapeTests,
} from './helpers.js';

describe('rule code_hash/dart', () => {
  it('hashes known dart source to the expected sha256 hex digest', async () => {
    const source = 'void main() {\n  print("hi");\n}\n';

    const result = await runDart({
      source,
      language: 'dart',
    });

    assert.deepEqual(result, {
      algorithm: 'sha256',
      file: 'b020e4dddbc46e58739fd55443cf9dce3629e9842a34f55f0ae8799568171539',
    });
  });

  it('hashes empty source deterministically', async () => {
    const result = await runDart({
      source: '',
      language: 'dart',
    });

    assert.deepEqual(result, EXPECTED_EMPTY_CODE_HASH);
  });

  it('keeps existing typescript and go code_hash outputs unchanged', async () => {
    await expectKnownCodeHashOutputs([
      {
        runRule: runTypeScript,
        input: { source: 'const a = 1;\n', language: 'typescript' },
        expected: EXPECTED_TYPESCRIPT_CODE_HASH,
      },
      {
        runRule: runGo,
        input: { source: 'package main\n\nfunc main() {}\n', language: 'go' },
        expected: EXPECTED_GO_CODE_HASH,
      },
    ]);
  });

  registerCodeHashDiffShapeTests('file.dart', 'dart');
});
