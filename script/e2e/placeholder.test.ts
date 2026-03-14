import { expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import {
  AnalyseOutputSchema,
  DiffOutputSchema,
  JsonErrorOutputSchema,
  RulesListOutputSchema,
} from '../../src/core/contracts/schemas.js';
import { canonicalStringify } from '../../src/core/format/canonical-json.js';
import { MAX_SOURCE_BYTES } from '../../src/core/source/limits.js';

const runCli = (args: string[], input?: string) =>
  spawnSync('node', ['--import', 'tsx', 'src/cmd/maat/index.ts', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    ...(input !== undefined ? { input } : {}),
  });

const runTwice = (args: string[], input?: string) => {
  return {
    first: runCli(args, input),
    second: runCli(args, input),
  };
};

const expectDeterministicSuccess = (
  first: ReturnType<typeof runCli>,
  second: ReturnType<typeof runCli>,
) => {
  expect(first.status).toBe(0);
  expect(second.status).toBe(0);
  expect(first.stdout).toBe(second.stdout);
};

const parseWithSchema = <T>(
  stdout: string,
  schema: { safeParse: (value: unknown) => { success: boolean; data?: T } },
): T => {
  const payload = JSON.parse(stdout) as unknown;
  const parsed = schema.safeParse(payload);
  expect(parsed.success).toBeTrue();
  if (!parsed.success || parsed.data === undefined) {
    throw new Error('schema parse failed');
  }
  return parsed.data;
};

const expectCanonicalGolden = (stdout: string, goldenPath: string) => {
  const golden = readFileSync(goldenPath, 'utf8');
  const goldenCanonical = `${canonicalStringify(JSON.parse(golden) as unknown)}\n`;
  expect(stdout).toBe(goldenCanonical);
};

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
  const data = parseWithSchema(result.stdout, AnalyseOutputSchema);

  expect(data.filename).toBe('testdata/analyse-input.ts');
  expect(data.language).toBe('typescript');
  expect(Object.keys(data.rules)).toEqual([
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

  const { first, second } = runTwice(args, input);
  expectDeterministicSuccess(first, second);
  parseWithSchema(first.stdout, AnalyseOutputSchema);
});

test('maat analyse rejects oversized stdin with deterministic json error envelope', () => {
  const oversized = `${'a'.repeat(MAX_SOURCE_BYTES)}b`;
  const args = [
    'analyse',
    '--rules',
    'code_hash',
    '--language',
    'typescript',
    '--json',
  ];

  const first = runCli(args, oversized);
  const second = runCli(args, oversized);

  expect(first.status).toBe(2);
  expect(second.status).toBe(2);
  expect(first.stderr).toBe('');
  expect(second.stderr).toBe('');
  expect(first.stdout).toBe(second.stdout);

  const parsed = parseWithSchema(first.stdout, JsonErrorOutputSchema);
  expect(parsed.error.code).toBe('E_SOURCE_TOO_LARGE');
  expect(parsed.error.message).toBe(
    `source_too_large: stdin source is ${MAX_SOURCE_BYTES + 1} bytes, limit is ${MAX_SOURCE_BYTES} bytes`,
  );
});

test('maat analyse multi-rule json output is byte-identical across repeated runs', () => {
  const args = [
    'analyse',
    '--in',
    'testdata/symbols/analyse.ts',
    '--rules',
    'function_map,method_map,class_map,interface_map,interfaces_code_map,file_metrics,code_hash',
    '--language',
    'typescript',
    '--json',
  ];

  const { first, second } = runTwice(args);
  expectDeterministicSuccess(first, second);
  parseWithSchema(first.stdout, AnalyseOutputSchema);
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
  const data = parseWithSchema(result.stdout, DiffOutputSchema);

  expect(data.from.filename).toBe('testdata/diff-from.ts');
  expect(data.to.filename).toBeUndefined();
  expect(data.from.language).toBe('typescript');
  expect(data.to.language).toBe('typescript');
  expect((data.rules.code_hash as { changed?: boolean }).changed).toBe(true);
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
  const data = parseWithSchema(result.stdout, DiffOutputSchema);
  expect(data.deltaOnly).toBeTrue();
});

test('maat rules json output matches schema', () => {
  const result = runCli(['rules', '--language', 'typescript', '--json']);

  expect(result.status).toBe(0);
  const data = parseWithSchema(result.stdout, RulesListOutputSchema);
  const names = data.rules.map((rule) => rule.name);
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

  const { first, second } = runTwice(args);
  expectDeterministicSuccess(first, second);
  parseWithSchema(first.stdout, AnalyseOutputSchema);
  expectCanonicalGolden(
    first.stdout,
    'testdata/import-files-fixture.golden.json',
  );
});

test('maat analyse import_files_list for go matches golden json and is deterministic', () => {
  const args = [
    'analyse',
    '--in',
    'testdata/go/imports/analyse.go',
    '--rules',
    'import_files_list',
    '--language',
    'go',
    '--json',
  ];

  const { first, second } = runTwice(args);
  expectDeterministicSuccess(first, second);
  parseWithSchema(first.stdout, AnalyseOutputSchema);
  expectCanonicalGolden(
    first.stdout,
    'testdata/go/imports/analyse.golden.json',
  );
});

test('maat analyse import_files_list + package_imports_list for go matches golden and is deterministic', () => {
  const args = [
    'analyse',
    '--in',
    'testdata/go/imports/analyse.go',
    '--rules',
    'import_files_list,package_imports_list',
    '--language',
    'go',
    '--json',
  ];

  const { first, second } = runTwice(args);
  expectDeterministicSuccess(first, second);
  parseWithSchema(first.stdout, AnalyseOutputSchema);
  expectCanonicalGolden(
    first.stdout,
    'testdata/go/imports/analyse-both.golden.json',
  );
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

  const { first, second } = runTwice(args);
  expectDeterministicSuccess(first, second);
  parseWithSchema(first.stdout, AnalyseOutputSchema);
  expectCanonicalGolden(
    first.stdout,
    'testdata/package-imports-fixture.golden.json',
  );
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

  const { first, second } = runTwice(args);
  expectDeterministicSuccess(first, second);
  parseWithSchema(first.stdout, DiffOutputSchema);
  expectCanonicalGolden(
    first.stdout,
    'testdata/metrics/diff-file-metrics.golden.json',
  );
});

test('maat diff go file_metrics matches golden and is deterministic', () => {
  const args = [
    'diff',
    '--from',
    'testdata/go/metrics/v1.go',
    '--to',
    'testdata/go/metrics/v2.go',
    '--rules',
    'file_metrics',
    '--language',
    'go',
    '--json',
  ];

  const { first, second } = runTwice(args);
  expectDeterministicSuccess(first, second);
  parseWithSchema(first.stdout, DiffOutputSchema);
  expectCanonicalGolden(
    first.stdout,
    'testdata/go/metrics/diff-file-metrics.golden.json',
  );
});

test('maat analyse go code_hash matches golden and is deterministic', () => {
  const args = [
    'analyse',
    '--in',
    'testdata/go/hash/v1.go',
    '--rules',
    'code_hash',
    '--language',
    'go',
    '--json',
  ];

  const { first, second } = runTwice(args);
  expectDeterministicSuccess(first, second);
  parseWithSchema(first.stdout, AnalyseOutputSchema);
  expectCanonicalGolden(first.stdout, 'testdata/go/hash/analyse.golden.json');
});

test('maat diff go code_hash matches golden and is deterministic', () => {
  const args = [
    'diff',
    '--from',
    'testdata/go/hash/v1.go',
    '--to',
    'testdata/go/hash/v2.go',
    '--rules',
    'code_hash',
    '--language',
    'go',
    '--json',
  ];

  const { first, second } = runTwice(args);
  expectDeterministicSuccess(first, second);
  parseWithSchema(first.stdout, DiffOutputSchema);
  expectCanonicalGolden(first.stdout, 'testdata/go/hash/diff.golden.json');
});

test('maat analyse go function_map and method_map match golden and are deterministic', () => {
  const args = [
    'analyse',
    '--in',
    'testdata/go/symbols/analyse.go',
    '--rules',
    'function_map,method_map',
    '--language',
    'go',
    '--json',
  ];

  const { first, second } = runTwice(args);
  expectDeterministicSuccess(first, second);
  parseWithSchema(first.stdout, AnalyseOutputSchema);
  expectCanonicalGolden(
    first.stdout,
    'testdata/go/symbols/analyse.golden.json',
  );
});

test('maat analyse go enriched function_map and method_map align with io rules and match golden', () => {
  const args = [
    'analyse',
    '--in',
    'testdata/go/symbols_metrics/analyse.go',
    '--rules',
    'function_map,method_map,io_calls_count,io_read_calls_count,io_write_calls_count',
    '--language',
    'go',
    '--json',
  ];

  const { first, second } = runTwice(args);
  expectDeterministicSuccess(first, second);
  const data = parseWithSchema(first.stdout, AnalyseOutputSchema);
  const functionMap = data.rules.function_map as Record<
    string,
    {
      ioCallsCount: number;
      ioReadCallsCount: number;
      ioWriteCallsCount: number;
    }
  >;
  const methodMap = data.rules.method_map as Record<
    string,
    {
      ioCallsCount: number;
      ioReadCallsCount: number;
      ioWriteCallsCount: number;
    }
  >;
  const ioAll = data.rules.io_calls_count as {
    functions: Record<string, number>;
    methods: Record<string, number>;
  };
  const ioRead = data.rules.io_read_calls_count as {
    functions: Record<string, number>;
    methods: Record<string, number>;
  };
  const ioWrite = data.rules.io_write_calls_count as {
    functions: Record<string, number>;
    methods: Record<string, number>;
  };

  for (const key of Object.keys(functionMap)) {
    expect(functionMap[key]?.ioCallsCount).toBe(ioAll.functions[key]);
    expect(functionMap[key]?.ioReadCallsCount).toBe(ioRead.functions[key]);
    expect(functionMap[key]?.ioWriteCallsCount).toBe(ioWrite.functions[key]);
  }

  for (const key of Object.keys(methodMap)) {
    expect(methodMap[key]?.ioCallsCount).toBe(ioAll.methods[key]);
    expect(methodMap[key]?.ioReadCallsCount).toBe(ioRead.methods[key]);
    expect(methodMap[key]?.ioWriteCallsCount).toBe(ioWrite.methods[key]);
  }

  expectCanonicalGolden(
    first.stdout,
    'testdata/go/symbols_metrics/analyse.golden.json',
  );
});

test('maat analyse go interface_map and interfaces_code_map match golden and are deterministic', () => {
  const args = [
    'analyse',
    '--in',
    'testdata/go/interfaces/analyse.go',
    '--rules',
    'interface_map,interfaces_code_map',
    '--language',
    'go',
    '--json',
  ];

  const { first, second } = runTwice(args);
  expectDeterministicSuccess(first, second);
  parseWithSchema(first.stdout, AnalyseOutputSchema);
  expectCanonicalGolden(
    first.stdout,
    'testdata/go/interfaces/analyse.golden.json',
  );
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

  const { first, second } = runTwice(args);
  expectDeterministicSuccess(first, second);
  parseWithSchema(first.stdout, AnalyseOutputSchema);
  expectCanonicalGolden(first.stdout, 'testdata/io/analyse.golden.json');
});

test('maat analyse go io count rules match golden and are deterministic', () => {
  const args = [
    'analyse',
    '--in',
    'testdata/go/io/analyse.go',
    '--rules',
    'io_calls_count,io_read_calls_count,io_write_calls_count',
    '--language',
    'go',
    '--json',
  ];

  const { first, second } = runTwice(args);
  expectDeterministicSuccess(first, second);
  parseWithSchema(first.stdout, AnalyseOutputSchema);
  expectCanonicalGolden(first.stdout, 'testdata/go/io/analyse.golden.json');
});

test('maat diff go enriched function_map and method_map delta-only matches golden and is deterministic', () => {
  const args = [
    'diff',
    '--from',
    'testdata/go/symbols_metrics/v1.go',
    '--to',
    'testdata/go/symbols_metrics/v2.go',
    '--rules',
    'function_map,method_map',
    '--language',
    'go',
    '--json',
    '--delta-only',
  ];

  const { first, second } = runTwice(args);
  expectDeterministicSuccess(first, second);
  parseWithSchema(first.stdout, DiffOutputSchema);
  expectCanonicalGolden(
    first.stdout,
    'testdata/go/symbols_metrics/diff.delta-only.golden.json',
  );
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

  const { first, second } = runTwice(args);
  expectDeterministicSuccess(first, second);
  parseWithSchema(first.stdout, DiffOutputSchema);
  expectCanonicalGolden(
    first.stdout,
    'testdata/io/diff-io-calls-delta-only.golden.json',
  );
});

test('maat diff go io_calls_count delta-only matches golden and is deterministic', () => {
  const args = [
    'diff',
    '--from',
    'testdata/go/io/diff-v1.go',
    '--to',
    'testdata/go/io/diff-v2.go',
    '--rules',
    'io_calls_count',
    '--language',
    'go',
    '--json',
    '--delta-only',
  ];

  const { first, second } = runTwice(args);
  expectDeterministicSuccess(first, second);
  parseWithSchema(first.stdout, DiffOutputSchema);
  expectCanonicalGolden(
    first.stdout,
    'testdata/go/io/diff-io-calls-delta-only.golden.json',
  );
});

test('maat analyse symbol map rules match golden and are deterministic', () => {
  const args = [
    'analyse',
    '--in',
    'testdata/symbols/analyse.ts',
    '--rules',
    'function_map,method_map,class_map,interface_map,interfaces_code_map',
    '--language',
    'typescript',
    '--json',
  ];

  const { first, second } = runTwice(args);
  expectDeterministicSuccess(first, second);
  parseWithSchema(first.stdout, AnalyseOutputSchema);
  expectCanonicalGolden(first.stdout, 'testdata/symbols/analyse.golden.json');
});

test('maat analyse symbol metrics + io rules match golden and are deterministic', () => {
  const args = [
    'analyse',
    '--in',
    'testdata/symbols_metrics/v1.ts',
    '--rules',
    'function_map,method_map,class_map,io_calls_count,io_read_calls_count,io_write_calls_count',
    '--language',
    'typescript',
    '--json',
  ];

  const { first, second } = runTwice(args);
  expectDeterministicSuccess(first, second);
  parseWithSchema(first.stdout, AnalyseOutputSchema);
  expectCanonicalGolden(
    first.stdout,
    'testdata/symbols_metrics/analyse.golden.json',
  );
});

test('maat diff function_map,file_metrics delta-only matches golden and is deterministic', () => {
  const args = [
    'diff',
    '--from',
    'testdata/symbols_metrics/v1.ts',
    '--to',
    'testdata/symbols_metrics/v2.ts',
    '--rules',
    'function_map,file_metrics',
    '--language',
    'typescript',
    '--json',
    '--delta-only',
  ];

  const { first, second } = runTwice(args);
  expectDeterministicSuccess(first, second);
  parseWithSchema(first.stdout, DiffOutputSchema);
  expectCanonicalGolden(
    first.stdout,
    'testdata/symbols_metrics/diff-function-map-file-metrics.delta-only.golden.json',
  );
});

test('maat analyse exception/error messages rules match golden and are deterministic', () => {
  const args = [
    'analyse',
    '--in',
    'testdata/messages/analyse.ts',
    '--rules',
    'exception_messages_list,error_messages_list',
    '--language',
    'typescript',
    '--json',
  ];

  const { first, second } = runTwice(args);
  expectDeterministicSuccess(first, second);
  parseWithSchema(first.stdout, AnalyseOutputSchema);
  expectCanonicalGolden(first.stdout, 'testdata/messages/analyse.golden.json');
});

test('maat analyse go exception/error messages rules match golden and are deterministic', () => {
  const args = [
    'analyse',
    '--in',
    'testdata/go/messages/analyse.go',
    '--rules',
    'exception_messages_list,error_messages_list',
    '--language',
    'go',
    '--json',
  ];

  const { first, second } = runTwice(args);
  expectDeterministicSuccess(first, second);
  parseWithSchema(first.stdout, AnalyseOutputSchema);
  expectCanonicalGolden(
    first.stdout,
    'testdata/go/messages/analyse.golden.json',
  );
});

test('maat analyse env names rule matches golden and is deterministic', () => {
  const args = [
    'analyse',
    '--in',
    'testdata/env/analyse.ts',
    '--rules',
    'env_names_list',
    '--language',
    'typescript',
    '--json',
  ];

  const { first, second } = runTwice(args);
  expectDeterministicSuccess(first, second);
  parseWithSchema(first.stdout, AnalyseOutputSchema);
  expectCanonicalGolden(first.stdout, 'testdata/env/analyse.golden.json');
});

test('maat analyse go env names rule matches golden and is deterministic', () => {
  const args = [
    'analyse',
    '--in',
    'testdata/go/env/analyse.go',
    '--rules',
    'env_names_list',
    '--language',
    'go',
    '--json',
  ];

  const { first, second } = runTwice(args);
  expectDeterministicSuccess(first, second);
  parseWithSchema(first.stdout, AnalyseOutputSchema);
  expectCanonicalGolden(first.stdout, 'testdata/go/env/analyse.golden.json');
});

test('maat analyse testcase titles rule matches golden and is deterministic', () => {
  const args = [
    'analyse',
    '--in',
    'testdata/tests/analyse.ts',
    '--rules',
    'testcase_titles_list',
    '--language',
    'typescript',
    '--json',
  ];

  const { first, second } = runTwice(args);
  expectDeterministicSuccess(first, second);
  parseWithSchema(first.stdout, AnalyseOutputSchema);
  expectCanonicalGolden(first.stdout, 'testdata/tests/analyse.golden.json');
});

test('maat analyse go testcase titles rule matches golden and is deterministic', () => {
  const args = [
    'analyse',
    '--in',
    'testdata/go/tests/analyse.go',
    '--rules',
    'testcase_titles_list',
    '--language',
    'go',
    '--json',
  ];

  const { first, second } = runTwice(args);
  expectDeterministicSuccess(first, second);
  parseWithSchema(first.stdout, AnalyseOutputSchema);
  expectCanonicalGolden(first.stdout, 'testdata/go/tests/analyse.golden.json');
});
