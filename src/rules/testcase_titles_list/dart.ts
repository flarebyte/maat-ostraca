import { extractDartTestcaseTitles } from '../_shared/dart/tests.js';
import type { RuleRunInput } from '../dispatch.js';

export const run = async (input: RuleRunInput): Promise<string[]> => {
  return extractDartTestcaseTitles(input);
};
