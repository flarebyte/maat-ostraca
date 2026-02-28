import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';

const runCli = (args: string[], input?: string) => {
  return spawnSync(
    process.execPath,
    ['--import', 'tsx', 'src/cmd/maat/index.ts', ...args],
    {
      encoding: 'utf8',
      ...(input !== undefined ? { input } : {}),
    },
  );
};

describe('maat cli parsing', () => {
  it('returns exit code 2 when required flags are missing', () => {
    const result = runCli(['analyse', '--language', 'go']);

    assert.equal(result.status, 2);
    assert.equal(
      result.stderr,
      "error: required option '--rules <csv>' not specified\n",
    );
  });

  it('returns exit code 2 when --delta-only is used without --json', () => {
    const result = runCli([
      'diff',
      '--from',
      'a.ts',
      '--rules',
      'import_*',
      '--language',
      'typescript',
      '--delta-only',
    ]);

    assert.equal(result.status, 2);
    assert.equal(result.stderr, '--delta-only requires --json\n');
  });

  it('unknown rule with --json prints JSON error envelope to stdout and exits 2', () => {
    const result = runCli(
      [
        'analyse',
        '--rules',
        'unknown_rule',
        '--language',
        'typescript',
        '--json',
      ],
      'const a = 1;\n',
    );

    assert.equal(result.status, 2);
    assert.equal(result.stderr, '');
    assert.equal(
      result.stdout,
      '{"error":{"code":"E_USAGE","message":"unknown rule \\"unknown_rule\\" for language \\"typescript\\""}}\n',
    );
  });

  it('unknown rule without --json prints deterministic stderr and exits 2', () => {
    const result = runCli(
      ['analyse', '--rules', 'unknown_rule', '--language', 'typescript'],
      'const a = 1;\n',
    );

    assert.equal(result.status, 2);
    assert.equal(result.stdout, '');
    assert.equal(
      result.stderr,
      'unknown rule "unknown_rule" for language "typescript"\n',
    );
  });

  it('returns sorted rules list for language in json mode', () => {
    const result = runCli(['rules', '--language', 'typescript', '--json']);

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
      ['analyse', '--rules', 'import_*', '--language', 'typescript', '--json'],
      'const a = 1;\r\n',
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

  it('json success output is byte-identical across runs', () => {
    const first = runCli(
      ['analyse', '--rules', 'import_*', '--language', 'typescript', '--json'],
      'const a = 1;\r\n',
    );
    const second = runCli(
      ['analyse', '--rules', 'import_*', '--language', 'typescript', '--json'],
      'const a = 1;\r\n',
    );

    assert.equal(first.status, 0);
    assert.equal(second.status, 0);
    assert.equal(first.stdout, second.stdout);
  });

  it('json error output is byte-identical across runs', () => {
    const first = runCli(
      [
        'analyse',
        '--rules',
        'unknown_rule',
        '--language',
        'typescript',
        '--json',
      ],
      'const a = 1;\n',
    );
    const second = runCli(
      [
        'analyse',
        '--rules',
        'unknown_rule',
        '--language',
        'typescript',
        '--json',
      ],
      'const a = 1;\n',
    );

    assert.equal(first.status, 2);
    assert.equal(second.status, 2);
    assert.equal(first.stdout, second.stdout);
  });
});
