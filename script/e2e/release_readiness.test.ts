import { expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import {
  expectSuccess,
  packagedBinPath,
  parseAnalyseOutput,
  parseDiffOutput,
  runBuiltTwice,
} from './helpers.js';

const build = () =>
  spawnSync('npm', ['run', 'build'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

const analyseRules =
  'import_files_list,package_imports_list,file_metrics,code_hash';
const diffRules = 'file_metrics,code_hash';

const assertBuiltCliRepeatedAnalyse = (
  fixturePath: string,
  language: 'typescript' | 'go' | 'dart',
) => {
  const args = [
    'analyse',
    '--in',
    fixturePath,
    '--rules',
    analyseRules,
    '--language',
    language,
    '--json',
  ];
  const { first, second } = runBuiltTwice(args);
  const firstStdout = expectSuccess(first);
  const secondStdout = expectSuccess(second);

  parseAnalyseOutput(firstStdout);
  parseAnalyseOutput(secondStdout);
  expect(firstStdout.equals(secondStdout)).toBeTrue();
};

const assertBuiltCliRepeatedDiff = (
  fromPath: string,
  toPath: string,
  language: 'typescript' | 'go' | 'dart',
) => {
  const args = [
    'diff',
    '--from',
    fromPath,
    '--to',
    toPath,
    '--rules',
    diffRules,
    '--language',
    language,
    '--json',
  ];
  const { first, second } = runBuiltTwice(args);
  const firstStdout = expectSuccess(first);
  const secondStdout = expectSuccess(second);

  parseDiffOutput(firstStdout);
  parseDiffOutput(secondStdout);
  expect(firstStdout.equals(secondStdout)).toBeTrue();
};

test('release readiness smoke uses the packaged cli entrypoint', () => {
  const result = build();
  expect(result.status).toBe(0);
  expect(packagedBinPath).toBe('dist/cmd/maat/index.js');
});

test('packaged cli analyse smoke passes for typescript', () => {
  assertBuiltCliRepeatedAnalyse(
    'testdata/determinism/wide-v1.ts',
    'typescript',
  );
});

test('packaged cli diff smoke passes for typescript', () => {
  assertBuiltCliRepeatedDiff(
    'testdata/determinism/wide-v1.ts',
    'testdata/determinism/wide-v2.ts',
    'typescript',
  );
});

test('packaged cli analyse smoke passes for go', () => {
  assertBuiltCliRepeatedAnalyse('testdata/go/determinism/wide-v1.go', 'go');
});

test('packaged cli diff smoke passes for go', () => {
  assertBuiltCliRepeatedDiff(
    'testdata/go/determinism/wide-v1.go',
    'testdata/go/determinism/wide-v2.go',
    'go',
  );
});

test('packaged cli analyse smoke passes for dart', () => {
  assertBuiltCliRepeatedAnalyse(
    'testdata/dart/determinism/wide-v1.dart',
    'dart',
  );
});

test('packaged cli diff smoke passes for dart', () => {
  assertBuiltCliRepeatedDiff(
    'testdata/dart/determinism/wide-v1.dart',
    'testdata/dart/determinism/wide-v2.dart',
    'dart',
  );
});
