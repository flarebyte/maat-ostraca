import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AnalyseOutput } from '../src/core/contracts/outputs.js';
import { diffResults } from '../src/core/diff/index.js';
import { run as runGo } from '../src/rules/code_hash/go.js';
import { run as runTypeScript } from '../src/rules/code_hash/typescript.js';

const base = (
  language: 'go' | 'typescript',
  rules: Record<string, unknown>,
): AnalyseOutput => ({
  filename: `file.${language === 'go' ? 'go' : 'ts'}`,
  language,
  rules,
});

describe('rule code_hash/go', () => {
  it('hashes known go source to the expected sha256 hex digest', async () => {
    const source = 'package main\n\nfunc main() {}\n';

    const result = await runGo({
      source,
      language: 'go',
    });

    assert.deepEqual(result, {
      algorithm: 'sha256',
      file: '55a60bb97151b2b4b680462447ce60ec34511b14fa10d77440c97b9777101566',
    });
  });

  it('hashes empty source deterministically', async () => {
    const result = await runGo({
      source: '',
      language: 'go',
    });

    assert.deepEqual(result, {
      algorithm: 'sha256',
      file: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    });
  });

  it('keeps existing typescript code_hash output unchanged', async () => {
    const result = await runTypeScript({
      source: 'const a = 1;\n',
      language: 'typescript',
    });

    assert.deepEqual(result, {
      algorithm: 'sha256',
      file: 'b79b14bd2584dd52b0f0ef042a2a4f104cda48330500e12237737cc51fbda43d',
    });
  });

  it('diff integration produces standard hash diff shape', () => {
    const from = base('go', {
      code_hash: { algorithm: 'sha256', file: 'abc' },
    });
    const to = base('go', {
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
    const from = base('go', {
      code_hash: { algorithm: 'sha256', file: 'same' },
    });
    const to = base('go', {
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
