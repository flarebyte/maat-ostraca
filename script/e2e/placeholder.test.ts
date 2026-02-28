import { expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';

const runCli = (args: string[], input?: string) =>
  spawnSync('node', ['--import', 'tsx', 'src/cmd/maat/index.ts', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    ...(input !== undefined ? { input } : {}),
  });

test('maat analyse with --in includes filename in json output', () => {
  const result = runCli([
    'analyse',
    '--in',
    'testdata/analyse-input.ts',
    '--rules',
    'import_*',
    '--language',
    'typescript',
    '--json',
  ]);

  expect(result.status).toBe(0);
  const payload = JSON.parse(result.stdout) as {
    filename?: string;
    language: string;
    rules: Record<string, null>;
  };

  expect(payload.filename).toBe('testdata/analyse-input.ts');
  expect(payload.language).toBe('typescript');
  expect(Object.keys(payload.rules)).toEqual([
    'import_files_list',
    'import_functions_list',
    'import_types_list',
  ]);
});

test('maat analyse via stdin succeeds and is deterministic', () => {
  const args = [
    'analyse',
    '--rules',
    'import_*',
    '--language',
    'typescript',
    '--json',
  ];
  const input = 'const a = 1;\r\n';

  const first = runCli(args, input);
  const second = runCli(args, input);

  expect(first.status).toBe(0);
  expect(second.status).toBe(0);
  expect(first.stdout).toBe(second.stdout);
});

test('maat diff uses stdin for to-source when --to is omitted', () => {
  const result = runCli(
    [
      'diff',
      '--from',
      'testdata/diff-from.ts',
      '--rules',
      'import_*',
      '--language',
      'typescript',
      '--json',
    ],
    'export const value = 2;\r\n',
  );

  expect(result.status).toBe(0);
  const payload = JSON.parse(result.stdout) as {
    from: { filename: string; language: string };
    to: { filename?: string; language: string };
    rules: Record<string, null>;
  };

  expect(payload.from.filename).toBe('testdata/diff-from.ts');
  expect(payload.to.filename).toBeUndefined();
  expect(payload.from.language).toBe('typescript');
  expect(payload.to.language).toBe('typescript');
  expect(Object.keys(payload.rules)).toEqual([
    'import_files_list',
    'import_functions_list',
    'import_types_list',
  ]);
});
