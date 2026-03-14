import { listGoImportPaths } from '../_shared/go/imports.js';
import type { RuleRunInput } from '../dispatch.js';

export const run = async (input: RuleRunInput): Promise<string[]> => {
  return listGoImportPaths(input, 'package_imports_list_error');
};
