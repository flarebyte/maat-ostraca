import { expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { RulesListOutputSchema } from '../../src/core/contracts/schemas.js';

interface PackageJsonShape {
  type?: string;
  bin?: Record<string, string> | string;
}

const run = (command: string, args: string[]) =>
  spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

const packageJson = JSON.parse(
  readFileSync('package.json', 'utf8'),
) as PackageJsonShape;

const binPath =
  typeof packageJson.bin === 'string' ? packageJson.bin : packageJson.bin?.maat;

test('packaged cli runs from dist and returns valid rules json', () => {
  expect(packageJson.type).toBe('module');
  expect(binPath).toBe('dist/cmd/maat/index.js');

  const build = run('npm', ['run', 'build']);
  expect(build.status).toBe(0);

  const result = run('node', [
    binPath ?? '',
    'rules',
    '--language',
    'typescript',
    '--json',
  ]);
  expect(result.status).toBe(0);
  expect(result.stderr).toBe('');

  const payload = JSON.parse(result.stdout) as unknown;
  const parsed = RulesListOutputSchema.safeParse(payload);
  expect(parsed.success).toBeTrue();
  if (!parsed.success) {
    throw new Error('RulesListOutputSchema parse failed');
  }
});
