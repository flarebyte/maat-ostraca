import { readFile } from 'node:fs/promises';
import { UsageError } from '../errors/index.js';
import type { Language } from '../types.js';
import { normalizeSource } from './normalize.js';
import { readStdinUtf8 } from './read-stdin.js';

export interface ResolveSourceInput {
  inPath?: string;
  language: Language;
}

export interface ResolvedSource {
  filename?: string;
  source: string;
  language: Language;
}

interface ResolveSourceDeps {
  readUtf8File?: (path: string) => Promise<string>;
  readStdin?: () => Promise<string>;
}

const defaultReadUtf8File = async (path: string): Promise<string> => {
  return readFile(path, 'utf8');
};

const ensureNonEmptyStdin = (raw: string): string => {
  if (raw.length === 0) {
    throw new UsageError(
      'stdin_empty: stdin is required when --in is omitted',
      {
        code: 'E_IO',
      },
    );
  }

  return raw;
};

export const resolveSource = async (
  input: ResolveSourceInput,
  deps: ResolveSourceDeps = {},
): Promise<ResolvedSource> => {
  const readUtf8File = deps.readUtf8File ?? defaultReadUtf8File;
  const readStdin = deps.readStdin ?? readStdinUtf8;

  if (input.inPath) {
    try {
      const source = normalizeSource(await readUtf8File(input.inPath));
      return {
        filename: input.inPath,
        source,
        language: input.language,
      };
    } catch {
      throw new UsageError(`file_read_error: cannot read "${input.inPath}"`, {
        code: 'E_IO',
      });
    }
  }

  const source = normalizeSource(ensureNonEmptyStdin(await readStdin()));
  return {
    source,
    language: input.language,
  };
};
