import type { RuleRunInput } from '../dispatch.js';

interface FileMetrics {
  loc: number;
  sloc: number;
  tokens: number;
}

const TOKEN_PATTERN = /[A-Za-z_$][A-Za-z0-9_$]*|\d+|[^\s]/g;

export const run = async (input: RuleRunInput): Promise<FileMetrics> => {
  void input.filename;
  void input.language;

  const lines = input.source.length === 0 ? [] : input.source.split('\n');
  const loc = lines.length;
  const sloc = lines.filter((line) => line.trim().length > 0).length;
  const tokens = input.source.match(TOKEN_PATTERN)?.length ?? 0;

  return { loc, sloc, tokens };
};
