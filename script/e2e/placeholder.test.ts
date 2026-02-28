import { expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import {
  AnalyseOutputSchema,
  DiffOutputSchema,
  RulesListOutputSchema,
} from '../../src/core/contracts/schemas.js';

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
    'import_files_list,file_metrics,code_hash',
    '--language',
    'typescript',
    '--json',
  ]);

  expect(result.status).toBe(0);
  const payload = JSON.parse(result.stdout) as unknown;
  const parsed = AnalyseOutputSchema.safeParse(payload);

  expect(parsed.success).toBeTrue();
  if (!parsed.success) {
    return;
  }

  expect(parsed.data.filename).toBe('testdata/analyse-input.ts');
  expect(parsed.data.language).toBe('typescript');
  expect(Object.keys(parsed.data.rules)).toEqual([
    'code_hash',
    'file_metrics',
    'import_files_list',
  ]);
});

test('maat analyse via stdin succeeds and is deterministic', () => {
  const args = [
    'analyse',
    '--rules',
    'import_files_list,file_metrics,code_hash',
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

  const parsed = AnalyseOutputSchema.safeParse(
    JSON.parse(first.stdout) as unknown,
  );
  expect(parsed.success).toBeTrue();
});

test('maat diff uses stdin for to-source when --to is omitted', () => {
  const result = runCli(
    [
      'diff',
      '--from',
      'testdata/diff-from.ts',
      '--rules',
      'import_files_list,file_metrics,code_hash',
      '--language',
      'typescript',
      '--json',
    ],
    'export const value = 2;\r\n',
  );

  expect(result.status).toBe(0);
  const payload = JSON.parse(result.stdout) as unknown;
  const parsed = DiffOutputSchema.safeParse(payload);

  expect(parsed.success).toBeTrue();
  if (!parsed.success) {
    return;
  }

  expect(parsed.data.from.filename).toBe('testdata/diff-from.ts');
  expect(parsed.data.to.filename).toBeUndefined();
  expect(parsed.data.from.language).toBe('typescript');
  expect(parsed.data.to.language).toBe('typescript');
  expect((parsed.data.rules.code_hash as { changed?: boolean }).changed).toBe(
    true,
  );
});

test('maat diff delta-only json output matches schema and includes top-level flag', () => {
  const result = runCli(
    [
      'diff',
      '--from',
      'testdata/diff-from.ts',
      '--rules',
      'import_files_list,file_metrics,code_hash',
      '--language',
      'typescript',
      '--json',
      '--delta-only',
    ],
    'export const value = 2;\r\n',
  );

  expect(result.status).toBe(0);
  const payload = JSON.parse(result.stdout) as unknown;
  const parsed = DiffOutputSchema.safeParse(payload);

  expect(parsed.success).toBeTrue();
  if (!parsed.success) {
    return;
  }

  expect(parsed.data.deltaOnly).toBeTrue();
});

test('maat rules json output matches schema', () => {
  const result = runCli(['rules', '--language', 'typescript', '--json']);

  expect(result.status).toBe(0);
  const payload = JSON.parse(result.stdout) as unknown;
  const parsed = RulesListOutputSchema.safeParse(payload);

  expect(parsed.success).toBeTrue();
  if (!parsed.success) {
    return;
  }

  const names = parsed.data.rules.map((rule) => rule.name);
  const sorted = [...names].sort((a, b) => a.localeCompare(b));
  expect(names).toEqual(sorted);
});
