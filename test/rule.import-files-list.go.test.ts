import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { canonicalStringify } from '../src/core/format/canonical-json.js';
import { runAnalyse } from '../src/core/run-analyse.js';
import { run } from '../src/rules/import_files_list/go.js';

const readFixture = (path: string): string => {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
};

describe('rule import_files_list/go', () => {
  it('extracts single import', async () => {
    const source = readFixture('../testdata/go/single-import.go');

    const result = await run({
      source,
      language: 'go',
    });

    assert.deepEqual(result, ['fmt']);
  });

  it('extracts grouped imports', async () => {
    const source = readFixture('../testdata/go/grouped-imports.go');

    const result = await run({
      source,
      language: 'go',
    });

    assert.deepEqual(result, ['fmt', 'github.com/acme/lib', 'net/http', 'os']);
  });

  it('ignores aliases and returns only paths', async () => {
    const source = readFixture('../testdata/go/aliased-imports.go');

    const result = await run({
      source,
      language: 'go',
    });

    assert.deepEqual(result, ['math', 'net/http/pprof']);
  });

  it('dedupes and sorts', async () => {
    const source = [
      'package sample',
      '',
      'import "os"',
      'import (',
      '  "fmt"',
      '  "os"',
      '  alias "github.com/acme/lib"',
      '  "fmt"',
      ')',
      '',
    ].join('\n');

    const result = await run({
      source,
      language: 'go',
    });

    assert.deepEqual(result, ['fmt', 'github.com/acme/lib', 'os']);
  });

  it('is deterministic across repeated runs with canonical json bytes', async () => {
    const source = readFixture('../testdata/go/imports/analyse.go');

    const first = await runAnalyse({
      filename: 'testdata/go/imports/analyse.go',
      source,
      language: 'go',
      rules: ['import_files_list'],
    });
    const second = await runAnalyse({
      filename: 'testdata/go/imports/analyse.go',
      source,
      language: 'go',
      rules: ['import_files_list'],
    });

    assert.equal(canonicalStringify(first), canonicalStringify(second));
  });
});
