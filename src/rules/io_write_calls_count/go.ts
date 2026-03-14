import { countGoIoBySymbol } from '../_shared/go/io.js';
import type { RuleRunInput } from '../dispatch.js';

export const run = async (input: RuleRunInput): Promise<unknown> => {
  return countGoIoBySymbol(input, 'write');
};
