import { extractGoEnvNames } from '../_shared/go/env.js';
import type { RuleRunInput } from '../dispatch.js';

export const run = async (input: RuleRunInput): Promise<string[]> => {
  return extractGoEnvNames(input);
};
