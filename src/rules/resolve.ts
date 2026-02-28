import type { Language } from '../core/types.js';
import { RULE_CATALOG, type RuleName } from './catalog.js';

export interface ResolveRulesInput {
  rules: string;
  language: Language;
}

export class RuleResolutionError extends Error {}

const isTrailingWildcard = (token: string): boolean => token.endsWith('*');

const byName = new Map(RULE_CATALOG.map((entry) => [entry.name, entry]));

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
    if (isTrailingWildcard(token)) {
      const prefix = token.slice(0, -1);
      const matches = RULE_CATALOG.filter(
        (entry) =>
          entry.name.startsWith(prefix) && entry.languages.includes(language),
      ).map((entry) => entry.name);

      if (matches.length === 0) {
        throw new RuleResolutionError(
          `wildcard selector "${token}" matched no rules for language "${language}"`,
        );
      }

      for (const match of matches) {
        resolved.add(match);
      }

      continue;
    }

    if (token.includes('*')) {
      throw new RuleResolutionError(
        `invalid wildcard selector "${token}" for language "${language}"`,
      );
    }

    if (!byName.has(token as RuleName)) {
      throw new RuleResolutionError(
        `unknown rule "${token}" for language "${language}"`,
      );
    }

    const entry = byName.get(token as RuleName);
    if (!entry?.languages.includes(language)) {
      throw new RuleResolutionError(
        `unsupported rule "${token}" for language "${language}"`,
      );
    }

    resolved.add(entry.name);
  }

  const sorted = [...resolved].sort((a, b) => a.localeCompare(b));
  if (sorted.length === 0) {
    throw new RuleResolutionError(
      `no rules selected for language "${language}"`,
    );
  }

  return sorted;
};
