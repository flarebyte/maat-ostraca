import type { JsonErrorOutput } from '../contracts/outputs.js';
import { canonicalStringify } from '../format/canonical-json.js';

export type ExitCode = 2 | 1;

type ErrorCode = 'E_USAGE' | 'E_IO' | 'E_INTERNAL';

interface ErrorDetails {
  details?: Record<string, unknown>;
  code?: ErrorCode;
}

export class UsageError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, options: ErrorDetails = {}) {
    super(message);
    this.name = 'UsageError';
    this.code = options.code ?? 'E_USAGE';
    if (options.details) {
      this.details = options.details;
    }
  }
}

export class InternalError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(message = 'internal error', options: ErrorDetails = {}) {
    super(message);
    this.name = 'InternalError';
    this.code = options.code ?? 'E_INTERNAL';
    if (options.details) {
      this.details = options.details;
    }
  }
}

const toInternalError = (error: unknown): InternalError => {
  if (error instanceof InternalError) {
    return error;
  }

  return new InternalError('internal error');
};

export const mapErrorToExitCode = (error: unknown): ExitCode => {
  if (error instanceof UsageError) {
    return 2;
  }

  return 1;
};

export const formatError = (
  error: unknown,
  options: { json: boolean },
): { exitCode: ExitCode; stdout?: string; stderr?: string } => {
  const normalized =
    error instanceof UsageError ? error : toInternalError(error);
  const exitCode = mapErrorToExitCode(normalized);

  if (options.json) {
    const payload: JsonErrorOutput = {
      error: {
        code: normalized.code,
        message: normalized.message,
        ...(normalized.details ? { details: normalized.details } : {}),
      },
    };

    return {
      exitCode,
      stdout: `${canonicalStringify(payload)}\n`,
    };
  }

  return {
    exitCode,
    stderr: `${normalized.message}\n`,
  };
};
