import { InternalError } from '../errors/index.js';

export const AST_GREP_TIMEOUT_MS = 5_000;

export interface AstGrepTimeoutOptions {
  timeoutMs?: number;
}

export const runAstGrepWithTimeout = async <T>(
  action: () => Promise<T>,
  options: AstGrepTimeoutOptions = {},
): Promise<T> => {
  const timeoutMs = options.timeoutMs ?? AST_GREP_TIMEOUT_MS;

  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(
        new InternalError(
          `analysis_timeout: ast-grep execution exceeded ${timeoutMs}ms`,
          {
            code: 'E_ANALYSIS_TIMEOUT',
          },
        ),
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
