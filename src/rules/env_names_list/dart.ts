import { extractDartEnvNames } from '../_shared/dart/env.js';
import type { RuleRunInput } from '../dispatch.js';

export const run = async (input: RuleRunInput): Promise<string[]> => {
  return extractDartEnvNames(input);
};
