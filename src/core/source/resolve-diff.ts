import { readFile } from 'node:fs/promises';
import { UsageError } from '../errors/index.js';
import type { Language } from '../types.js';
import { normalizeSource } from './normalize.js';
import { readStdinUtf8 } from './read-stdin.js';

export interface ResolveDiffSourceInput {
  fromPath: string;
  toPath?: string;
  language: Language;
}

export interface ResolvedDiffSource {
  fromFilename: string;
  fromSource: string;
  toFilename?: string;
  toSource: string;
  language: Language;
}

interface ResolveDiffSourceDeps {
  readUtf8File?: (path: string) => Promise<string>;
  readStdin?: () => Promise<string>;
}

const defaultReadUtf8File = async (path: string): Promise<string> => {
  return readFile(path, 'utf8');
};

const ensureNonEmptyStdin = (raw: string): string => {
  if (raw.length === 0) {
    throw new UsageError(
      'stdin_empty: stdin is required when --to is omitted',
      {
        code: 'E_IO',
      },
    );
  }

  return raw;
};

export const resolveDiffSource = async (
  input: ResolveDiffSourceInput,
  deps: ResolveDiffSourceDeps = {},
): Promise<ResolvedDiffSource> => {
  const readUtf8File = deps.readUtf8File ?? defaultReadUtf8File;
  const readStdin = deps.readStdin ?? readStdinUtf8;

  let fromSource: string;
  try {
    fromSource = normalizeSource(await readUtf8File(input.fromPath));
  } catch {
    throw new UsageError(`file_read_error: cannot read "${input.fromPath}"`, {
      code: 'E_IO',
    });
  }

  if (input.toPath) {
    try {
      const toSource = normalizeSource(await readUtf8File(input.toPath));
      return {
        fromFilename: input.fromPath,
        fromSource,
        toFilename: input.toPath,
        toSource,
        language: input.language,
      };
    } catch {
      throw new UsageError(`file_read_error: cannot read "${input.toPath}"`, {
        code: 'E_IO',
      });
    }
  }

  const toSource = normalizeSource(ensureNonEmptyStdin(await readStdin()));
  return {
    fromFilename: input.fromPath,
    fromSource,
    toSource,
    language: input.language,
  };
};
