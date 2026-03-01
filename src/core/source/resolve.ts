import type { Language } from '../types.js';
import {
  defaultReadUtf8File,
  ensureNonEmptyStdinOrThrowUsage,
  type ReadUtf8File,
  readNormalizedFileOrThrowUsage,
} from './io.js';
import { ensureSourceWithinLimit } from './limits.js';
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
  readUtf8File?: ReadUtf8File;
  readStdin?: () => Promise<string>;
}

export const resolveSource = async (
  input: ResolveSourceInput,
  deps: ResolveSourceDeps = {},
): Promise<ResolvedSource> => {
  const readUtf8File = deps.readUtf8File ?? defaultReadUtf8File;
  const readStdin = deps.readStdin ?? readStdinUtf8;

  if (input.inPath) {
    const source = ensureSourceWithinLimit(
      await readNormalizedFileOrThrowUsage(input.inPath, readUtf8File),
      `source "${input.inPath}"`,
    );
    return {
      filename: input.inPath,
      source,
      language: input.language,
    };
  }

  const source = ensureSourceWithinLimit(
    normalizeSource(
      ensureNonEmptyStdinOrThrowUsage(
        await readStdin(),
        'stdin_empty: stdin is required when --in is omitted',
      ),
    ),
    'stdin source',
  );
  return {
    source,
    language: input.language,
  };
};
