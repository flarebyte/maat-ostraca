import { extractDartErrorMessages } from '../_shared/dart/messages.js';
import type { RuleRunInput } from '../dispatch.js';

export const run = async (input: RuleRunInput): Promise<string[]> => {
  return extractDartErrorMessages(input);
};
