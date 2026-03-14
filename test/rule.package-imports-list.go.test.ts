import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { run as runImportFilesList } from '../src/rules/import_files_list/go.js';
import { run } from '../src/rules/package_imports_list/go.js';

const readFixture = (path: string): string => {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
};

describe('rule package_imports_list/go', () => {
  it('extracts single stdlib import', async () => {
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

  it('includes third-party imports', async () => {
    const source = 'package sample\n\nimport "github.com/acme/lib"\n';

    const result = await run({
      source,
      language: 'go',
    });

    assert.deepEqual(result, ['github.com/acme/lib']);
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

  it('keeps import_files_list output unchanged for the shared go fixture', async () => {
    const source = readFixture('../testdata/go/imports/analyse.go');

    const result = await runImportFilesList({
      source,
      language: 'go',
    });

    assert.deepEqual(result, [
      'fmt',
      'github.com/acme/lib',
      'math',
      'net/http',
      'net/http/pprof',
      'os',
    ]);
  });
});
