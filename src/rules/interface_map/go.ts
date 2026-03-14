import {
  buildInterfaceMap,
  type InterfaceMapEntry,
} from '../_shared/common.js';
import { extractGoInterfaces } from '../_shared/go/interfaces.js';
import type { RuleRunInput } from '../dispatch.js';

export const run = async (
  input: RuleRunInput,
): Promise<Record<string, InterfaceMapEntry>> => {
  return buildInterfaceMap(extractGoInterfaces(input));
};
