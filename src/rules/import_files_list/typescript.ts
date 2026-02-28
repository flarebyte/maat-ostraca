import type { RuleRunInput } from '../dispatch.js';

const IMPORT_PATH_PATTERN =
  /\bimport\s+(?:[^'"\n\r]*?\s+from\s+)?['"]([^'"]+)['"]/g;

export const run = async (input: RuleRunInput): Promise<string[]> => {
  void input.filename;
  void input.language;

  const imports = new Set<string>();
  let match = IMPORT_PATH_PATTERN.exec(input.source);

  while (match !== null) {
    const importPath = match[1];
    if (importPath !== undefined) {
      imports.add(importPath);
    }
    match = IMPORT_PATH_PATTERN.exec(input.source);
  }

  return [...imports].sort((a, b) => a.localeCompare(b));
};
