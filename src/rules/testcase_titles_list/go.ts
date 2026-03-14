import { extractGoTestcaseTitles } from '../_shared/go/tests.js';
import type { RuleRunInput } from '../dispatch.js';

export const run = async (input: RuleRunInput): Promise<string[]> => {
  return extractGoTestcaseTitles(input);
};
