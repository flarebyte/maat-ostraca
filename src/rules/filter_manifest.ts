import { UsageError } from '../core/errors/index.js';
import type { Language } from '../core/types.js';
import { RULE_CATALOG, type RuleName } from './catalog.js';
import { validateRuleName } from './validate_name.js';

interface FilterManifestInput {
  language: Language;
  match?: string;
}

const baseManifestForLanguage = (language: Language) => {
  return RULE_CATALOG.filter((entry) => entry.languages.includes(language))
    .map((entry) => ({
      name: entry.name,
      description: entry.description,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
};

const parseMatchTokens = (match: string, language: Language): RuleName[] => {
  const tokens = match
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  if (tokens.length === 0) {
    throw new UsageError(`no rules matched for language "${language}"`);
  }

  const selected = new Set<RuleName>();
  for (const token of tokens) {
    selected.add(validateRuleName(token, language));
  }

  return [...selected].sort((left, right) => left.localeCompare(right));
};

export const filterRulesManifest = ({
  language,
  match,
}: FilterManifestInput) => {
  const manifest = baseManifestForLanguage(language);
  if (match === undefined) {
    return manifest;
  }

  const names = new Set(parseMatchTokens(match, language));
  return manifest.filter((entry) => names.has(entry.name));
};
