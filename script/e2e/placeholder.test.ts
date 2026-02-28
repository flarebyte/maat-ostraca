import { expect, test } from 'bun:test';

const runCli = (...args: string[]) =>
  Bun.spawnSync({
    cmd: ['node', '--import', 'tsx', 'src/cmd/maat/index.ts', ...args],
    cwd: process.cwd(),
    stdout: 'pipe',
    stderr: 'pipe',
  });

test('maat rules json output is deterministic', () => {
  const first = runCli('rules', '--language', 'typescript', '--json');
  const second = runCli('rules', '--language', 'typescript', '--json');

  const firstOut = new TextDecoder().decode(first.stdout);
  const secondOut = new TextDecoder().decode(second.stdout);

  expect(first.exitCode).toBe(0);
  expect(second.exitCode).toBe(0);
  expect(firstOut).toBe(secondOut);

  const parsed = JSON.parse(firstOut) as {
    language: string;
    rules: Array<{ name: string; description: string }>;
  };
  const names = parsed.rules.map((rule) => rule.name);
  const sorted = [...names].sort((a, b) => a.localeCompare(b));

  expect(parsed.language).toBe('typescript');
  expect(names).toEqual(sorted);
  expect(names.includes('import_files_list')).toBeTrue();
});
