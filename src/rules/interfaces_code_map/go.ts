import { extractGoInterfaces } from '../_shared/go/interfaces.js';
import type { RuleRunInput } from '../dispatch.js';

export const run = async (
  input: RuleRunInput,
): Promise<Record<string, string>> => {
  const output: Record<string, string> = {};

  for (const symbol of extractGoInterfaces(input)) {
    output[symbol.name] = symbol.code;
  }

  return output;
};
