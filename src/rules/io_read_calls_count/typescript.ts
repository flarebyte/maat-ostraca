import { countIoBySymbol } from '../_shared/typescript/io_count.js';
import type { RuleRunInput } from '../dispatch.js';

export const run = async (input: RuleRunInput): Promise<unknown> => {
  return countIoBySymbol(input.source, input.language, 'read');
};
