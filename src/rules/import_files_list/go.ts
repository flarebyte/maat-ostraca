import { InternalError } from '../../core/errors/index.js';
import type { RuleRunInput } from '../dispatch.js';

const IMPORT_ALIAS_PATTERN = String.raw`(?:[A-Za-z_][A-Za-z0-9_]*|_|\.)`;
const IMPORT_PATH_PATTERN = `${String.raw`(?:"([^"\r\n]*)"|`}\`([^\`]*)\`)`;
const SINGLE_IMPORT_PATTERN = new RegExp(
  String.raw`^\s*import\s+(?:${IMPORT_ALIAS_PATTERN}\s+)?${IMPORT_PATH_PATTERN}`,
  'gm',
);
const GROUP_IMPORT_PATTERN = /^\s*import\s*\(([\s\S]*?)^\s*\)/gm;
const GROUPED_IMPORT_SPEC_PATTERN = new RegExp(
  String.raw`^\s*(?:${IMPORT_ALIAS_PATTERN}\s+)?${IMPORT_PATH_PATTERN}`,
  'gm',
);

const sortDedup = (values: readonly string[]): string[] => {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
};

const toImportPath = (match: RegExpExecArray): string | undefined => {
  return match[1] ?? match[2];
};

const extractSingleImports = (source: string): string[] => {
  const matches = source.matchAll(SINGLE_IMPORT_PATTERN);
  const imports: string[] = [];

  for (const match of matches) {
    const path = toImportPath(match);
    if (path !== undefined) {
      imports.push(path);
    }
  }

  return imports;
};

const extractGroupedImports = (source: string): string[] => {
  const imports: string[] = [];

  for (const blockMatch of source.matchAll(GROUP_IMPORT_PATTERN)) {
    const block = blockMatch[1];
    if (block === undefined) {
      continue;
    }

    for (const specMatch of block.matchAll(GROUPED_IMPORT_SPEC_PATTERN)) {
      const path = toImportPath(specMatch);
      if (path !== undefined) {
        imports.push(path);
      }
    }
  }

  return imports;
};

export const run = async (input: RuleRunInput): Promise<string[]> => {
  if (input.language !== 'go') {
    throw new InternalError(
      `import_files_list_error: unsupported language "${input.language}"`,
    );
  }

  try {
    return sortDedup([
      ...extractSingleImports(input.source),
      ...extractGroupedImports(input.source),
    ]);
  } catch {
    throw new InternalError('astgrep_error: failed to extract go imports');
  }
};
