import { extractGoErrorMessages } from '../_shared/go/messages.js';
import type { RuleRunInput } from '../dispatch.js';

export const run = async (input: RuleRunInput): Promise<string[]> => {
  return extractGoErrorMessages(input);
};
