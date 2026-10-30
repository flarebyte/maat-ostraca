import { it } from 'node:test';
import type { run as Run } from '../src/rules/import_files_list/go.js';
import { expectFixtureRuleOutput, expectRuleOutput } from './helpers.js';
export const registerGoImportCases = (run: typeof Run, singleTitle: string) => {
  it(singleTitle, async () => {
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
};
