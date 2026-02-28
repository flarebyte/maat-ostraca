import { listTypeScriptModuleSpecifiers } from '../_shared/typescript/import_specifiers.js';
import type { RuleRunInput } from '../dispatch.js';

export const run = async (input: RuleRunInput): Promise<string[]> => {
  return listTypeScriptModuleSpecifiers(input.source, input.language);
};
