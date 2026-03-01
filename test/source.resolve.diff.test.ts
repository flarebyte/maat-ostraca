import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { UsageError } from '../src/core/errors/index.js';
import { MAX_SOURCE_BYTES } from '../src/core/source/limits.js';
import { resolveDiffSource } from '../src/core/source/resolve-diff.js';

describe('source.resolve.diff', () => {
  it('reads both files when toPath is provided', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'maat-diff-source-'));
    const fromFile = join(dir, 'from.ts');
    const toFile = join(dir, 'to.ts');

    try {
      await writeFile(fromFile, 'from\r\nline\r\n', 'utf8');
      await writeFile(toFile, 'to\r\nline\r\n', 'utf8');

      const resolved = await resolveDiffSource({
        fromPath: fromFile,
        toPath: toFile,
        language: 'typescript',
      });

      assert.equal(resolved.fromFilename, fromFile);
      assert.equal(resolved.toFilename, toFile);
      assert.equal(resolved.fromSource, 'from\nline\n');
      assert.equal(resolved.toSource, 'to\nline\n');
      assert.equal(resolved.language, 'typescript');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('reads to-source from stdin when toPath is omitted', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'maat-diff-source-stdin-'));
    const fromFile = join(dir, 'from.ts');

    try {
      await writeFile(fromFile, 'from\r\nline\r\n', 'utf8');

      const resolved = await resolveDiffSource(
        { fromPath: fromFile, language: 'typescript' },
        { readStdin: async () => 'to\r\nline\r\n' },
      );

      assert.equal(resolved.fromFilename, fromFile);
      assert.equal(resolved.toFilename, undefined);
      assert.equal(resolved.fromSource, 'from\nline\n');
      assert.equal(resolved.toSource, 'to\nline\n');
      assert.equal(resolved.language, 'typescript');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('rejects empty stdin when toPath is omitted', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'maat-diff-source-empty-'));
    const fromFile = join(dir, 'from.ts');

    try {
      await writeFile(fromFile, 'from\nline\n', 'utf8');

      await assert.rejects(
        () =>
          resolveDiffSource(
            { fromPath: fromFile, language: 'typescript' },
            { readStdin: async () => '' },
          ),
        new UsageError('stdin_empty: stdin is required when --to is omitted', {
          code: 'E_IO',
        }),
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('normalizes CRLF to LF consistently for file and stdin', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'maat-diff-source-policy-'));
    const fromFile = join(dir, 'from.ts');

    try {
      await writeFile(fromFile, 'x\r\ny\r\n', 'utf8');

      const resolved = await resolveDiffSource(
        { fromPath: fromFile, language: 'typescript' },
        { readStdin: async () => 'a\r\nb\r\n' },
      );

      assert.equal(resolved.fromSource, 'x\ny\n');
      assert.equal(resolved.toSource, 'a\nb\n');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('rejects oversized diff source from file by utf8 byte length', async () => {
    const oversized = `${'a'.repeat(MAX_SOURCE_BYTES)}b`;

    await assert.rejects(
      () =>
        resolveDiffSource(
          {
            fromPath: 'from.ts',
            toPath: 'to.ts',
            language: 'typescript',
          },
          {
            readUtf8File: async () => oversized,
          },
        ),
      new UsageError(
        `source_too_large: source "from.ts" is ${MAX_SOURCE_BYTES + 1} bytes, limit is ${MAX_SOURCE_BYTES} bytes`,
        { code: 'E_SOURCE_TOO_LARGE' },
      ),
    );
  });
});
