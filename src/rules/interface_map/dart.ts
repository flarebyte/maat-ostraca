import { extractDartInterfaces } from '../_shared/dart/interfaces.js';
import type { RuleRunInput } from '../dispatch.js';

interface InterfaceMapEntry {
  modifiers: string[];
  extends: string[];
  methods: string[];
}

export const run = async (
  input: RuleRunInput,
): Promise<Record<string, InterfaceMapEntry>> => {
  const output: Record<string, InterfaceMapEntry> = {};

  for (const symbol of extractDartInterfaces(input)) {
    output[symbol.name] = {
      modifiers: symbol.modifiers,
      extends: symbol.extendsNames,
      methods: symbol.methods,
    };
  }

  return output;
};
