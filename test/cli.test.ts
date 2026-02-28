import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';

const runCli = (...args: string[]) => {
  return spawnSync(
    process.execPath,
    ['--import', 'tsx', 'src/cmd/maat/index.ts', ...args],
    {
      encoding: 'utf8',
    },
  );
};

describe('maat cli parsing', () => {
  it('returns exit code 2 when required flags are missing', () => {
    const result = runCli('analyse', '--language', 'go');

    assert.equal(result.status, 2);
    assert.match(result.stderr, /^usage error: /);
  });

  it('returns exit code 2 when --delta-only is used without --json', () => {
    const result = runCli(
      'diff',
      '--from',
      'a.ts',
      '--rules',
      'import_*',
      '--language',
      'typescript',
      '--delta-only',
    );

    assert.equal(result.status, 2);
    assert.equal(result.stderr, 'usage error: --delta-only requires --json\n');
  });

  it('returns sorted rules list for language in json mode', () => {
    const result = runCli('rules', '--language', 'typescript', '--json');

    assert.equal(result.status, 0);

    const payload = JSON.parse(result.stdout) as {
      language: string;
      rules: Array<{ name: string; description: string }>;
    };

    assert.equal(payload.language, 'typescript');
    const names = payload.rules.map((rule) => rule.name);
    const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
    assert.deepEqual(names, sortedNames);
    assert.ok(names.includes('import_files_list'));
  });

  it('analyse json includes expanded wildcard rule keys', () => {
    const result = runCli(
      'analyse',
      '--rules',
      'import_*',
      '--language',
      'typescript',
      '--json',
    );

    assert.equal(result.status, 0);
    const payload = JSON.parse(result.stdout) as {
      language: string;
      rules: Record<string, null>;
    };

    assert.equal(payload.language, 'typescript');
    assert.deepEqual(Object.keys(payload.rules), [
      'import_files_list',
      'import_functions_list',
      'import_types_list',
    ]);
  });

  it('wildcard invocation json output is byte-identical across runs', () => {
    const first = runCli(
      'analyse',
      '--rules',
      'import_*',
      '--language',
      'typescript',
      '--json',
    );
    const second = runCli(
      'analyse',
      '--rules',
      'import_*',
      '--language',
      'typescript',
      '--json',
    );

    assert.equal(first.status, 0);
    assert.equal(second.status, 0);
    assert.equal(first.stdout, second.stdout);
  });
});
