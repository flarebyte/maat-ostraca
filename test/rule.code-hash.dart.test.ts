import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AnalyseOutput } from '../src/core/contracts/outputs.js';
import { diffResults } from '../src/core/diff/index.js';
import { run as runDart } from '../src/rules/code_hash/dart.js';
import { run as runGo } from '../src/rules/code_hash/go.js';
import { run as runTypeScript } from '../src/rules/code_hash/typescript.js';

const base = (
  language: 'dart' | 'go' | 'typescript',
  rules: Record<string, unknown>,
): AnalyseOutput => ({
  filename:
    language === 'dart'
      ? 'file.dart'
      : language === 'go'
        ? 'file.go'
        : 'file.ts',
  language,
  rules,
});

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

    assert.deepEqual(result, {
      algorithm: 'sha256',
      file: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    });
  });

  it('keeps existing typescript and go code_hash outputs unchanged', async () => {
    const typeScriptResult = await runTypeScript({
      source: 'const a = 1;\n',
      language: 'typescript',
    });
    const goResult = await runGo({
      source: 'package main\n\nfunc main() {}\n',
      language: 'go',
    });

    assert.deepEqual(typeScriptResult, {
      algorithm: 'sha256',
      file: 'b79b14bd2584dd52b0f0ef042a2a4f104cda48330500e12237737cc51fbda43d',
    });
    assert.deepEqual(goResult, {
      algorithm: 'sha256',
      file: '55a60bb97151b2b4b680462447ce60ec34511b14fa10d77440c97b9777101566',
    });
  });

  it('diff integration produces standard hash diff shape', () => {
    const from = base('dart', {
      code_hash: { algorithm: 'sha256', file: 'abc' },
    });
    const to = base('dart', {
      code_hash: { algorithm: 'sha256', file: 'def' },
    });

    const diff = diffResults(from, to, {});

    assert.deepEqual(diff.rules.code_hash, {
      from: 'abc',
      to: 'def',
      changed: true,
    });
  });

  it('diff integration produces unchanged and delta-only hash shapes', () => {
    const from = base('dart', {
      code_hash: { algorithm: 'sha256', file: 'same' },
    });
    const to = base('dart', {
      code_hash: { algorithm: 'sha256', file: 'same' },
    });

    const regular = diffResults(from, to, {});
    const delta = diffResults(from, to, { deltaOnly: true });

    assert.deepEqual(regular.rules.code_hash, {
      from: 'same',
      to: 'same',
      changed: false,
    });
    assert.deepEqual(delta.rules.code_hash, { changed: false });
  });
});
