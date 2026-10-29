import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canonicalStringify } from '../src/core/format/canonical-json.js';
import { runAnalyse } from '../src/core/run-analyse.js';
import { run } from '../src/rules/import_files_list/go.js';
import { registerGoImportCases } from './go-import-cases.js';
import { readFixture } from './helpers.js';

describe('rule import_files_list/go', () => {
  registerGoImportCases(run, 'extracts single import');

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
