import { search, searchByKind } from '../../../core/astgrep/index.js';
import type { Language } from '../../../core/contracts/language.js';

const IMPORT_FROM_RE = /\bfrom\s+(['"])([^'"\r\n]+)\1/;
const IMPORT_SIDE_EFFECT_RE = /^\s*import\s+(['"])([^'"\r\n]+)\1\s*;?\s*$/;

const extractModuleSpecifier = (statement: string): string | undefined => {
  const fromMatch = statement.match(IMPORT_FROM_RE);
  if (fromMatch?.[2]) {
    return fromMatch[2];
  }

  const sideEffectMatch = statement.match(IMPORT_SIDE_EFFECT_RE);
  if (sideEffectMatch?.[2]) {
    return sideEffectMatch[2];
  }

  return undefined;
};

export const listTypeScriptModuleSpecifiers = async (
  source: string,
  language: Language,
): Promise<string[]> => {
  const [importMatches, typeImportMatches, exportStatements] =
    await Promise.all([
      search({
        source,
        language,
        pattern: 'import $A',
      }),
      search({
        source,
        language,
        pattern: 'import type $A from $B',
      }),
      searchByKind({
        source,
        language,
        kindName: 'export_statement',
      }),
    ]);

  const specifiers = new Set<string>();
  for (const match of [
    ...importMatches,
    ...typeImportMatches,
    ...exportStatements,
  ]) {
    const specifier = extractModuleSpecifier(match.text);
    if (specifier) {
      specifiers.add(specifier);
    }
  }

  return [...specifiers].sort((a, b) => a.localeCompare(b));
};
