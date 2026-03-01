import type { Language } from '../types.js';
import {
  defaultReadUtf8File,
  ensureNonEmptyStdinOrThrowUsage,
  type ReadUtf8File,
  readNormalizedFileOrThrowUsage,
} from './io.js';
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
  readUtf8File?: ReadUtf8File;
  readStdin?: () => Promise<string>;
}

export const resolveDiffSource = async (
  input: ResolveDiffSourceInput,
  deps: ResolveDiffSourceDeps = {},
): Promise<ResolvedDiffSource> => {
  const readUtf8File = deps.readUtf8File ?? defaultReadUtf8File;
  const readStdin = deps.readStdin ?? readStdinUtf8;

  const fromSource = await readNormalizedFileOrThrowUsage(
    input.fromPath,
    readUtf8File,
  );

  if (input.toPath) {
    const toSource = await readNormalizedFileOrThrowUsage(
      input.toPath,
      readUtf8File,
    );
    return {
      fromFilename: input.fromPath,
      fromSource,
      toFilename: input.toPath,
      toSource,
      language: input.language,
    };
  }

  const toSource = normalizeSource(
    ensureNonEmptyStdinOrThrowUsage(
      await readStdin(),
      'stdin_empty: stdin is required when --to is omitted',
    ),
  );
  return {
    fromFilename: input.fromPath,
    fromSource,
    toSource,
    language: input.language,
  };
};
