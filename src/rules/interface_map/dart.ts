import {
  buildInterfaceMap,
  type InterfaceMapEntry,
} from '../_shared/common.js';
import { extractDartInterfaces } from '../_shared/dart/interfaces.js';
import type { RuleRunInput } from '../dispatch.js';

export const run = async (
  input: RuleRunInput,
): Promise<Record<string, InterfaceMapEntry>> => {
  return buildInterfaceMap(extractDartInterfaces(input));
};
