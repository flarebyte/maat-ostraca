import { expect } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import {
  AnalyseOutputSchema,
  DiffOutputSchema,
  JsonErrorOutputSchema,
} from '../../src/core/contracts/schemas.js';
import { canonicalStringify } from '../../src/core/format/canonical-json.js';

export interface CliResult {
  stdout: Buffer;
  stderr: Buffer;
  exitCode: number;
}

export const runCli = (args: string[], input?: string): CliResult => {
  const result = spawnSync(
    'node',
    ['--import', 'tsx', 'src/cmd/maat/index.ts', ...args],
    {
      cwd: process.cwd(),
      encoding: 'buffer',
      ...(input !== undefined ? { input } : {}),
    },
  );

  return {
    stdout: result.stdout ?? Buffer.alloc(0),
    stderr: result.stderr ?? Buffer.alloc(0),
    exitCode: result.status ?? 1,
  };
};

export const runTwice = (
  args: string[],
  input?: string,
): { first: CliResult; second: CliResult } => {
  return {
    first: runCli(args, input),
    second: runCli(args, input),
  };
};

export const asUtf8 = (value: Buffer): string => value.toString('utf8');

export const equalBytes = (left: Buffer, right: Buffer): boolean => {
  return left.equals(right);
};

export const expectSuccess = (result: CliResult): Buffer => {
  expect(result.exitCode).toBe(0);
  expect(result.stderr.length).toBe(0);
  expect(result.stdout.length).toBeGreaterThan(0);
  return result.stdout;
};

export const parseAnalyseOutput = (stdout: Buffer) => {
  const payload = JSON.parse(asUtf8(stdout)) as unknown;
  const parsed = AnalyseOutputSchema.safeParse(payload);
  expect(parsed.success).toBeTrue();
  if (!parsed.success) {
    throw new Error('AnalyseOutputSchema parse failed');
  }
  return parsed.data;
};

export const parseDiffOutput = (stdout: Buffer) => {
  const payload = JSON.parse(asUtf8(stdout)) as unknown;
  const parsed = DiffOutputSchema.safeParse(payload);
  expect(parsed.success).toBeTrue();
  if (!parsed.success) {
    throw new Error('DiffOutputSchema parse failed');
  }
  return parsed.data;
};

export const parseJsonErrorOutput = (stdout: Buffer) => {
  const payload = JSON.parse(asUtf8(stdout)) as unknown;
  const parsed = JsonErrorOutputSchema.safeParse(payload);
  expect(parsed.success).toBeTrue();
  if (!parsed.success) {
    throw new Error('JsonErrorOutputSchema parse failed');
  }
  return parsed.data;
};

export const expectGolden = (stdout: Buffer, goldenPath: string) => {
  const golden = readFileSync(goldenPath, 'utf8');
  const expected = Buffer.from(
    `${canonicalStringify(JSON.parse(golden) as unknown)}\n`,
    'utf8',
  );
  expect(equalBytes(stdout, expected)).toBeTrue();
};

export const expectRepeatedAnalyseGolden = (
  args: string[],
  goldenPath: string,
) => {
  const { first, second } = runTwice(args);
  const firstStdout = expectSuccess(first);
  const secondStdout = expectSuccess(second);

  parseAnalyseOutput(firstStdout);
  parseAnalyseOutput(secondStdout);
  expect(equalBytes(firstStdout, secondStdout)).toBeTrue();
  expectGolden(firstStdout, goldenPath);
};

export const expectRepeatedDiffGolden = (
  args: string[],
  goldenPath: string,
) => {
  const { first, second } = runTwice(args);
  const firstStdout = expectSuccess(first);
  const secondStdout = expectSuccess(second);

  parseDiffOutput(firstStdout);
  parseDiffOutput(secondStdout);
  expect(equalBytes(firstStdout, secondStdout)).toBeTrue();
  expectGolden(firstStdout, goldenPath);
};
