import { listDartPackageImportUris } from '../_shared/dart/imports.js';
import type { RuleRunInput } from '../dispatch.js';

export const run = async (input: RuleRunInput): Promise<string[]> => {
  return listDartPackageImportUris(input, 'package_imports_list_error');
};
