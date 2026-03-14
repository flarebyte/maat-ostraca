import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { run as runImportFilesList } from '../src/rules/import_files_list/go.js';
import { run } from '../src/rules/package_imports_list/go.js';
import {
  expectFixtureRuleOutput,
  expectRuleOutput,
  readFixture,
} from './helpers.js';

describe('rule package_imports_list/go', () => {
  it('extracts single stdlib import', async () => {
    await expectFixtureRuleOutput(
      run,
      '../testdata/go/single-import.go',
      'go',
      ['fmt'],
    );
  });

  it('extracts grouped imports', async () => {
    await expectFixtureRuleOutput(
      run,
      '../testdata/go/grouped-imports.go',
      'go',
      ['fmt', 'github.com/acme/lib', 'net/http', 'os'],
    );
  });

  it('includes third-party imports', async () => {
    const source = 'package sample\n\nimport "github.com/acme/lib"\n';
    await expectRuleOutput(run, { source, language: 'go' }, [
      'github.com/acme/lib',
    ]);
  });

  it('ignores aliases and returns only paths', async () => {
    await expectFixtureRuleOutput(
      run,
      '../testdata/go/aliased-imports.go',
      'go',
      ['math', 'net/http/pprof'],
    );
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

    await expectRuleOutput(run, { source, language: 'go' }, [
      'fmt',
      'github.com/acme/lib',
      'os',
    ]);
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
