import { spawnSync } from 'node:child_process';

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
