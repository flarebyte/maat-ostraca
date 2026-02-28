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
      'x',
      '--language',
      'typescript',
      '--delta-only',
    );

    assert.equal(result.status, 2);
    assert.equal(result.stderr, 'usage error: --delta-only requires --json\n');
  });

  it('emits deterministic valid json for repeated invocations', () => {
    const first = runCli('rules', '--language', 'typescript', '--json');
    const second = runCli('rules', '--language', 'typescript', '--json');

    assert.equal(first.status, 0);
    assert.equal(second.status, 0);
    assert.equal(first.stdout, second.stdout);
    assert.deepEqual(JSON.parse(first.stdout), {
      language: 'typescript',
      rules: [],
    });
  });
});
