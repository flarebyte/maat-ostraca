import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import {
  resolveSource,
  SourceResolutionError,
} from '../src/core/source/resolve.js';

describe('source.resolve', () => {
  it('reads from file when inPath is provided', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'maat-source-'));
    const file = join(dir, 'input.ts');

    try {
      await writeFile(file, 'line1\r\nline2\r\n', 'utf8');
      const resolved = await resolveSource({
        inPath: file,
        language: 'typescript',
      });

      assert.equal(resolved.filename, file);
      assert.equal(resolved.source, 'line1\nline2\n');
      assert.equal(resolved.language, 'typescript');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('reads from stdin when inPath is omitted', async () => {
    const resolved = await resolveSource(
      { language: 'typescript' },
      { readStdin: async () => 'stdin\r\ncontent\r\n' },
    );

    assert.equal(resolved.filename, undefined);
    assert.equal(resolved.source, 'stdin\ncontent\n');
    assert.equal(resolved.language, 'typescript');
  });

  it('rejects empty stdin', async () => {
    await assert.rejects(
      () =>
        resolveSource(
          { language: 'typescript' },
          { readStdin: async () => '' },
        ),
      new SourceResolutionError(
        'stdin_empty: stdin is required when --in is omitted',
      ),
    );
  });

  it('normalizes CRLF to LF consistently for file and stdin', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'maat-source-policy-'));
    const file = join(dir, 'input.ts');

    try {
      await writeFile(file, 'a\r\nb\r\n', 'utf8');
      const fromFile = await resolveSource({
        inPath: file,
        language: 'typescript',
      });
      const fromStdin = await resolveSource(
        { language: 'typescript' },
        { readStdin: async () => 'a\r\nb\r\n' },
      );

      assert.equal(fromFile.source, 'a\nb\n');
      assert.equal(fromStdin.source, 'a\nb\n');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
