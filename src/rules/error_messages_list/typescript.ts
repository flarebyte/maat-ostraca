import { extractErrorMessages } from '../_shared/typescript/message_extract.js';
import type { RuleRunInput } from '../dispatch.js';

export const run = async (input: RuleRunInput): Promise<string[]> => {
  return extractErrorMessages(input.source, input.language);
};
