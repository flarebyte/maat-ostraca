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
  expect(firstOut).toBe('{"language":"typescript","rules":[]}\n');
});
