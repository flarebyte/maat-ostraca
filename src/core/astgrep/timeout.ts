import { InternalError } from '../errors/index.js';

export const ASTGREP_TIMEOUT_MS = 5_000;
export const AST_GREP_TIMEOUT_MS = ASTGREP_TIMEOUT_MS;

export interface AstGrepTimeoutOptions {
  timeoutMs?: number;
}

export const withTimeout = async <T>(
  action: () => Promise<T>,
  timeoutMs: number,
): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(
        new InternalError('analysis timed out', {
          code: 'E_ANALYSIS_TIMEOUT',
        }),
      );
    }, timeoutMs);

    void action()
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
};

export const runAstGrepWithTimeout = async <T>(
  action: () => Promise<T>,
  options: AstGrepTimeoutOptions = {},
): Promise<T> => {
  const timeoutMs = options.timeoutMs ?? ASTGREP_TIMEOUT_MS;
  return withTimeout(action, timeoutMs);
};
