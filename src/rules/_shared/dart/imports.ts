import { InternalError } from '../../../core/errors/index.js';
import type { RuleRunInput } from '../../dispatch.js';

const IMPORT_PATTERN =
  /^\s*import\s+(['"])([^'"\r\n]+)\1(?:[^;\r\n]*|\r?\n\s+[^;\r\n]*)*;/gm;

const sortUniqueImportUris = (values: readonly string[]): string[] => {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
};

const extractDartImportUris = (source: string): string[] => {
  const imports: string[] = [];

  for (const match of source.matchAll(IMPORT_PATTERN)) {
    const uri = match[2];
    if (uri !== undefined) {
      imports.push(uri);
    }
  }

  return imports;
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
    return sortUniqueImportUris(extractDartImportUris(input.source));
  } catch {
    throw new InternalError('astgrep_error: failed to extract dart imports');
  }
};

export const listDartPackageImportUris = (
  input: RuleRunInput,
  errorPrefix: string,
): string[] => {
  if (input.language !== 'dart') {
    throw new InternalError(
      `${errorPrefix}: unsupported language "${input.language}"`,
    );
  }

  try {
    return sortUniqueImportUris(
      extractDartImportUris(input.source).filter((uri) =>
        uri.startsWith('package:'),
      ),
    );
  } catch {
    throw new InternalError('astgrep_error: failed to extract dart imports');
  }
};
