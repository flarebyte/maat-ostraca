import { extractTypeScriptSymbols } from '../_shared/typescript/symbol_extract.js';
import type { RuleRunInput } from '../dispatch.js';

export const run = async (
  input: RuleRunInput,
): Promise<Record<string, string>> => {
  const output: Record<string, string> = {};
  const symbols = await extractTypeScriptSymbols(input.source, input.language);

  for (const symbol of symbols.interfaces) {
    output[symbol.name] = symbol.code;
  }

  return output;
};
