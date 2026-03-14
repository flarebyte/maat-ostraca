import { InternalError } from '../../../core/errors/index.js';
import type { RuleRunInput } from '../../dispatch.js';

const IMPORT_PATTERN =
  /^\s*import\s+(['"])([^'"\r\n]+)\1(?:[^;\r\n]*|\r?\n\s+[^;\r\n]*)*;/gm;

const sortDedup = (values: readonly string[]): string[] => {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
};

export const listDartImportUris = (
  input: RuleRunInput,
  errorPrefix: string,
): string[] => {
  if (input.language !== 'dart') {
    throw new InternalError(
      `${errorPrefix}: unsupported language "${input.language}"`,
    );
  }

  try {
    const imports: string[] = [];

    for (const match of input.source.matchAll(IMPORT_PATTERN)) {
      const uri = match[2];
      if (uri !== undefined) {
        imports.push(uri);
      }
    }

    return sortDedup(imports);
  } catch {
    throw new InternalError('astgrep_error: failed to extract dart imports');
  }
};
