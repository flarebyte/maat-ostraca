import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import {
  AnalyseOutputSchema,
  DiffOutputSchema,
  JsonErrorOutputSchema,
} from '../../src/core/contracts/schemas.js';
import { canonicalStringify } from '../../src/core/format/canonical-json.js';
import { asUtf8, equalBytes, type runCli, runTwice } from './helpers.js';

const COMMON_RULES = [
  'import_files_list',
  'package_imports_list',
  'file_metrics',
  'code_hash',
].join(',');

const MATRIX = [
  {
    language: 'typescript',
    analyseIn: 'testdata/determinism/wide-v1.ts',
    diffFrom: 'testdata/determinism/wide-v1.ts',
    diffTo: 'testdata/determinism/wide-v2.ts',
    analyseGolden: 'testdata/determinism/matrix-common-analyse.golden.json',
    diffGolden: 'testdata/determinism/matrix-common-diff.golden.json',
  },
  {
    language: 'go',
    analyseIn: 'testdata/go/determinism/wide-v1.go',
    diffFrom: 'testdata/go/determinism/wide-v1.go',
    diffTo: 'testdata/go/determinism/wide-v2.go',
    analyseGolden: 'testdata/go/determinism/matrix-common-analyse.golden.json',
    diffGolden: 'testdata/go/determinism/matrix-common-diff.golden.json',
  },
  {
    language: 'dart',
    analyseIn: 'testdata/dart/determinism/wide-v1.dart',
    diffFrom: 'testdata/dart/determinism/wide-v1.dart',
    diffTo: 'testdata/dart/determinism/wide-v2.dart',
    analyseGolden:
      'testdata/dart/determinism/matrix-common-analyse.golden.json',
    diffGolden: 'testdata/dart/determinism/matrix-common-diff.golden.json',
  },
] as const;

const expectSuccess = (result: ReturnType<typeof runCli>): Buffer => {
  expect(result.exitCode).toBe(0);
  expect(result.stderr.length).toBe(0);
  expect(result.stdout.length).toBeGreaterThan(0);
  return result.stdout;
};

const expectAnalyseSchema = (stdout: Buffer) => {
  const parsed = AnalyseOutputSchema.safeParse(JSON.parse(asUtf8(stdout)));
  expect(parsed.success).toBeTrue();
  if (!parsed.success) {
    throw new Error('AnalyseOutputSchema parse failed');
  }
};

const expectDiffSchema = (stdout: Buffer) => {
  const parsed = DiffOutputSchema.safeParse(JSON.parse(asUtf8(stdout)));
  expect(parsed.success).toBeTrue();
  if (!parsed.success) {
    throw new Error('DiffOutputSchema parse failed');
  }
};

const expectJsonErrorSchema = (stdout: Buffer) => {
  const parsed = JsonErrorOutputSchema.safeParse(JSON.parse(asUtf8(stdout)));
  expect(parsed.success).toBeTrue();
  if (!parsed.success) {
    throw new Error('JsonErrorOutputSchema parse failed');
  }
  return parsed.data;
};

const expectGolden = (stdout: Buffer, goldenPath: string) => {
  const golden = readFileSync(goldenPath, 'utf8');
  const expected = Buffer.from(
    `${canonicalStringify(JSON.parse(golden) as unknown)}\n`,
    'utf8',
  );
  expect(equalBytes(stdout, expected)).toBeTrue();
};

for (const entry of MATRIX) {
  test(`${entry.language} analyse common-rule matrix output matches schema, golden, and repeated-run bytes`, () => {
    const args = [
      'analyse',
      '--in',
      entry.analyseIn,
      '--rules',
      COMMON_RULES,
      '--language',
      entry.language,
      '--json',
    ];

    const { first, second } = runTwice(args);
    const firstStdout = expectSuccess(first);
    const secondStdout = expectSuccess(second);

    expectAnalyseSchema(firstStdout);
    expectAnalyseSchema(secondStdout);
    expect(equalBytes(firstStdout, secondStdout)).toBeTrue();
    expectGolden(firstStdout, entry.analyseGolden);
  });

  test(`${entry.language} diff common-rule matrix output matches schema, golden, and repeated-run bytes`, () => {
    const args = [
      'diff',
      '--from',
      entry.diffFrom,
      '--to',
      entry.diffTo,
      '--rules',
      COMMON_RULES,
      '--language',
      entry.language,
      '--json',
    ];

    const { first, second } = runTwice(args);
    const firstStdout = expectSuccess(first);
    const secondStdout = expectSuccess(second);

    expectDiffSchema(firstStdout);
    expectDiffSchema(secondStdout);
    expect(equalBytes(firstStdout, secondStdout)).toBeTrue();
    expectGolden(firstStdout, entry.diffGolden);
  });

  test(`${entry.language} diff common-rule delta-only output is byte-identical across repeated runs`, () => {
    const args = [
      'diff',
      '--from',
      entry.diffFrom,
      '--to',
      entry.diffTo,
      '--rules',
      COMMON_RULES,
      '--language',
      entry.language,
      '--json',
      '--delta-only',
    ];

    const { first, second } = runTwice(args);
    const firstStdout = expectSuccess(first);
    const secondStdout = expectSuccess(second);

    const firstParsed = DiffOutputSchema.parse(JSON.parse(asUtf8(firstStdout)));
    const secondParsed = DiffOutputSchema.parse(
      JSON.parse(asUtf8(secondStdout)),
    );

    expect(equalBytes(firstStdout, secondStdout)).toBeTrue();
    expect(firstParsed.deltaOnly).toBeTrue();
    expect(secondParsed.deltaOnly).toBeTrue();
  });

  test(`${entry.language} analyse json error envelope remains structurally identical across repeated runs`, () => {
    const args = [
      'analyse',
      '--in',
      entry.analyseIn,
      '--rules',
      'not_a_real_rule',
      '--language',
      entry.language,
      '--json',
    ];

    const { first, second } = runTwice(args);
    expect(first.exitCode).toBe(2);
    expect(second.exitCode).toBe(2);
    expect(first.stderr.length).toBe(0);
    expect(second.stderr.length).toBe(0);
    expect(equalBytes(first.stdout, second.stdout)).toBeTrue();

    const firstParsed = expectJsonErrorSchema(first.stdout);
    const secondParsed = expectJsonErrorSchema(second.stdout);

    expect(firstParsed.error.code).toBe('E_USAGE');
    expect(secondParsed.error.code).toBe('E_USAGE');
  });
}
