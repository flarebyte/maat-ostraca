import { runRust } from '../_shared/rust/analyse.js';
import type { RuleRunInput } from '../dispatch.js';
export const run = async (input: RuleRunInput): Promise<unknown> =>
  runRust(input, 'interface_map');
