import { search } from '../../core/astgrep/search.js';
import type { RuleRunInput } from '../dispatch.js';

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

export const run = async (input: RuleRunInput): Promise<string[]> => {
  const importMatches = await search({
    source: input.source,
    language: input.language,
    pattern: 'import $A',
  });
  const typeImportMatches = await search({
    source: input.source,
    language: input.language,
    pattern: 'import type $A from $B',
  });
  const matches = [...importMatches, ...typeImportMatches];

  const imports = new Set<string>();
  for (const match of matches) {
    const specifier = extractModuleSpecifier(match.text);
    if (specifier) {
      imports.add(specifier);
    }
  }

  return [...imports].sort((a, b) => a.localeCompare(b));
};
