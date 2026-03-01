import { extractExceptionMessages } from '../_shared/typescript/message_extract.js';
import type { RuleRunInput } from '../dispatch.js';

export const run = async (input: RuleRunInput): Promise<string[]> => {
  return extractExceptionMessages(input.source, input.language);
};
