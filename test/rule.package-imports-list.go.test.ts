import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { run as runImportFilesList } from '../src/rules/import_files_list/go.js';
import { run } from '../src/rules/package_imports_list/go.js';
import { registerGoImportCases } from './go-import-cases.js';
import { expectRuleOutput, readFixture } from './helpers.js';

describe('rule package_imports_list/go', () => {
  registerGoImportCases(run, 'extracts single stdlib import');

  it('includes third-party imports', async () => {
    const source = 'package sample\n\nimport "github.com/acme/lib"\n';
    await expectRuleOutput(run, { source, language: 'go' }, [
      'github.com/acme/lib',
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
