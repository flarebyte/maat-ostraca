import { listTypeScriptModuleSpecifiers } from '../_shared/typescript/import_specifiers.js';
import type { RuleRunInput } from '../dispatch.js';

const isExternalPackageSpecifier = (specifier: string): boolean => {
  return !(
    specifier.startsWith('./') ||
    specifier.startsWith('../') ||
    specifier.startsWith('/') ||
    specifier.startsWith('file:')
  );
};

export const run = async (input: RuleRunInput): Promise<string[]> => {
  const specifiers = await listTypeScriptModuleSpecifiers(
    input.source,
    input.language,
  );

  return specifiers.filter(isExternalPackageSpecifier);
};
