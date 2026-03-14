import { UsageError } from '../core/errors/index.js';
import type { Language } from '../core/types.js';
import { RULE_CATALOG, type RuleName } from './catalog.js';
import { IMPLEMENTED_RULES_BY_LANGUAGE } from './dispatch.js';

export interface ResolveRulesInput {
  rules: string;
  language: Language;
}

const isTrailingWildcard = (token: string): boolean => token.endsWith('*');

const byName = new Map(RULE_CATALOG.map((entry) => [entry.name, entry]));
const allImplementedRulesForLanguage = (language: Language): RuleName[] => {
  return IMPLEMENTED_RULES_BY_LANGUAGE.get(language) ?? [];
};

export const resolveRules = ({
  rules,
  language,
}: ResolveRulesInput): RuleName[] => {
  const tokens = rules
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  const resolved = new Set<RuleName>();

  for (const token of tokens) {
    if (token === '*') {
      const matches = allImplementedRulesForLanguage(language);

      if (matches.length === 0) {
        throw new UsageError(
          `wildcard selector "*" matched no rules for language "${language}"`,
        );
      }

      for (const match of matches) {
        resolved.add(match);
      }

      continue;
    }

    if (isTrailingWildcard(token)) {
      const prefix = token.slice(0, -1);
      const matches = RULE_CATALOG.filter(
        (entry) =>
          entry.name.startsWith(prefix) && entry.languages.includes(language),
      ).map((entry) => entry.name);

      if (matches.length === 0) {
        throw new UsageError(
          `wildcard selector "${token}" matched no rules for language "${language}"`,
        );
      }

      for (const match of matches) {
        resolved.add(match);
      }

      continue;
    }

    if (token.includes('*')) {
      throw new UsageError(
        `invalid wildcard selector "${token}" for language "${language}"`,
      );
    }

    if (!byName.has(token as RuleName)) {
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

    resolved.add(entry.name);
  }

  const sorted = [...resolved].sort((a, b) => a.localeCompare(b));
  if (sorted.length === 0) {
    throw new UsageError(`no rules selected for language "${language}"`);
  }

  return sorted;
};
