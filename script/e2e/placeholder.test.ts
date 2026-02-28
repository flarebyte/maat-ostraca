import { expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import {
  AnalyseOutputSchema,
  DiffOutputSchema,
  RulesListOutputSchema,
} from '../../src/core/contracts/schemas.js';
import { canonicalStringify } from '../../src/core/format/canonical-json.js';

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

test('maat analyse import_files_list matches golden json and is deterministic', () => {
  const args = [
    'analyse',
    '--in',
    'testdata/import-files-fixture.ts',
    '--rules',
    'import_files_list',
    '--language',
    'typescript',
    '--json',
  ];

  const first = runCli(args);
  const second = runCli(args);

  expect(first.status).toBe(0);
  expect(second.status).toBe(0);
  expect(first.stdout).toBe(second.stdout);

  const payload = JSON.parse(first.stdout) as unknown;
  const parsed = AnalyseOutputSchema.safeParse(payload);
  expect(parsed.success).toBeTrue();

  const golden = readFileSync(
    'testdata/import-files-fixture.golden.json',
    'utf8',
  );
  const goldenCanonical = `${canonicalStringify(JSON.parse(golden) as unknown)}\n`;
  expect(first.stdout).toBe(goldenCanonical);
});

test('maat analyse import_files_list + package_imports_list matches golden and is deterministic', () => {
  const args = [
    'analyse',
    '--in',
    'testdata/package-imports-fixture.ts',
    '--rules',
    'import_files_list,package_imports_list',
    '--language',
    'typescript',
    '--json',
  ];

  const first = runCli(args);
  const second = runCli(args);

  expect(first.status).toBe(0);
  expect(second.status).toBe(0);
  expect(first.stdout).toBe(second.stdout);

  const payload = JSON.parse(first.stdout) as unknown;
  const parsed = AnalyseOutputSchema.safeParse(payload);
  expect(parsed.success).toBeTrue();

  const golden = readFileSync(
    'testdata/package-imports-fixture.golden.json',
    'utf8',
  );
  const goldenCanonical = `${canonicalStringify(JSON.parse(golden) as unknown)}\n`;
  expect(first.stdout).toBe(goldenCanonical);
});

test('maat diff file_metrics matches golden and is deterministic', () => {
  const args = [
    'diff',
    '--from',
    'testdata/metrics/v1.ts',
    '--to',
    'testdata/metrics/v2.ts',
    '--rules',
    'file_metrics',
    '--language',
    'typescript',
    '--json',
  ];

  const first = runCli(args);
  const second = runCli(args);

  expect(first.status).toBe(0);
  expect(second.status).toBe(0);
  expect(first.stdout).toBe(second.stdout);

  const payload = JSON.parse(first.stdout) as unknown;
  const parsed = DiffOutputSchema.safeParse(payload);
  expect(parsed.success).toBeTrue();

  const golden = readFileSync(
    'testdata/metrics/diff-file-metrics.golden.json',
    'utf8',
  );
  const goldenCanonical = `${canonicalStringify(JSON.parse(golden) as unknown)}\n`;
  expect(first.stdout).toBe(goldenCanonical);
});

test('maat analyse io count rules match golden and are deterministic', () => {
  const args = [
    'analyse',
    '--in',
    'testdata/io/analyse.ts',
    '--rules',
    'io_calls_count,io_read_calls_count,io_write_calls_count',
    '--language',
    'typescript',
    '--json',
  ];

  const first = runCli(args);
  const second = runCli(args);

  expect(first.status).toBe(0);
  expect(second.status).toBe(0);
  expect(first.stdout).toBe(second.stdout);

  const payload = JSON.parse(first.stdout) as unknown;
  const parsed = AnalyseOutputSchema.safeParse(payload);
  expect(parsed.success).toBeTrue();

  const golden = readFileSync('testdata/io/analyse.golden.json', 'utf8');
  const goldenCanonical = `${canonicalStringify(JSON.parse(golden) as unknown)}\n`;
  expect(first.stdout).toBe(goldenCanonical);
});

test('maat diff io_calls_count delta-only matches golden and is deterministic', () => {
  const args = [
    'diff',
    '--from',
    'testdata/io/diff-v1.ts',
    '--to',
    'testdata/io/diff-v2.ts',
    '--rules',
    'io_calls_count',
    '--language',
    'typescript',
    '--json',
    '--delta-only',
  ];

  const first = runCli(args);
  const second = runCli(args);

  expect(first.status).toBe(0);
  expect(second.status).toBe(0);
  expect(first.stdout).toBe(second.stdout);

  const payload = JSON.parse(first.stdout) as unknown;
  const parsed = DiffOutputSchema.safeParse(payload);
  expect(parsed.success).toBeTrue();

  const golden = readFileSync(
    'testdata/io/diff-io-calls-delta-only.golden.json',
    'utf8',
  );
  const goldenCanonical = `${canonicalStringify(JSON.parse(golden) as unknown)}\n`;
  expect(first.stdout).toBe(goldenCanonical);
});
