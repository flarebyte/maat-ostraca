import { readFile } from 'node:fs/promises';
import { UsageError } from '../errors/index.js';
import { normalizeSource } from './normalize.js';

export type ReadUtf8File = (path: string) => Promise<string>;

export const defaultReadUtf8File: ReadUtf8File = async (
  path: string,
): Promise<string> => {
  return readFile(path, 'utf8');
};

export const readNormalizedFileOrThrowUsage = async (
  path: string,
  readUtf8File: ReadUtf8File,
): Promise<string> => {
  try {
    return normalizeSource(await readUtf8File(path));
  } catch {
    throw new UsageError(`file_read_error: cannot read "${path}"`, {
      code: 'E_IO',
    });
  }
};

export const ensureNonEmptyStdinOrThrowUsage = (
  raw: string,
  message: string,
): string => {
  if (raw.length === 0) {
    throw new UsageError(message, {
      code: 'E_IO',
    });
  }

  return raw;
};
