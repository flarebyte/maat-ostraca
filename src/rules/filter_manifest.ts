import { UsageError } from '../core/errors/index.js';
import type { Language } from '../core/types.js';
import { RULE_CATALOG, RULE_NAMES, type RuleName } from './catalog.js';

interface FilterManifestInput {
  language: Language;
  match?: string;
}

const byName = new Map(RULE_CATALOG.map((entry) => [entry.name, entry]));

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
    if (!RULE_NAMES.includes(token as RuleName)) {
      throw new UsageError(
        `unknown rule "${token}" for language "${language}"`,
      );
    }

    const entry = byName.get(token as RuleName);
    if (!entry?.languages.includes(language)) {
      throw new UsageError(
        `unsupported rule "${token}" for language "${language}"`,
      );
    }

    selected.add(token as RuleName);
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
