import { countDartIoBySymbol } from '../_shared/dart/io.js';
import type { RuleRunInput } from '../dispatch.js';

export const run = async (input: RuleRunInput): Promise<unknown> => {
  return countDartIoBySymbol(input, 'read');
};
