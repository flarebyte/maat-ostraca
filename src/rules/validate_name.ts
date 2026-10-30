import { UsageError } from '../core/errors/index.js';
import type { Language } from '../core/types.js';
import { RULE_CATALOG, type RuleName } from './catalog.js';

const byName = new Map(RULE_CATALOG.map((entry) => [entry.name, entry]));
export const validateRuleName = (
  token: string,
  language: Language,
): RuleName => {
  const entry = byName.get(token as RuleName);
  if (!entry)
    throw new UsageError(`unknown rule "${token}" for language "${language}"`);
  if (!entry.languages.includes(language))
    throw new UsageError(
      `unsupported rule "${token}" for language "${language}"`,
    );
  return entry.name;
};
