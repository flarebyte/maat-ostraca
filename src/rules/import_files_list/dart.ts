import { listDartImportUris } from '../_shared/dart/imports.js';
import type { RuleRunInput } from '../dispatch.js';

export const run = async (input: RuleRunInput): Promise<string[]> => {
  return listDartImportUris(input, 'import_files_list_error');
};
