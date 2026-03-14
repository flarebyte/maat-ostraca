import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canonicalStringify } from '../src/core/format/canonical-json.js';
import { runAnalyse } from '../src/core/run-analyse.js';
import { run } from '../src/rules/import_files_list/go.js';
import {
  expectFixtureRuleOutput,
  expectRuleOutput,
  readFixture,
} from './helpers.js';

describe('rule import_files_list/go', () => {
  it('extracts single import', async () => {
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
