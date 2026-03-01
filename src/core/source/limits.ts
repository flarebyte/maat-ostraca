import { UsageError } from '../errors/index.js';

export const MAX_SOURCE_BYTES = 5 * 1024 * 1024;

const utf8Bytes = (value: string): number => Buffer.byteLength(value, 'utf8');

export const ensureSourceWithinLimit = (
  source: string,
  label: string,
): string => {
  const size = utf8Bytes(source);

  if (size > MAX_SOURCE_BYTES) {
    throw new UsageError(
      `source_too_large: ${label} is ${size} bytes, limit is ${MAX_SOURCE_BYTES} bytes`,
      {
        code: 'E_SOURCE_TOO_LARGE',
      },
    );
  }

  return source;
};
