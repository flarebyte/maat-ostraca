import { runRust } from '../_shared/rust/analyse.js';
import type { RuleRunInput } from '../dispatch.js';
export const run = async (input: RuleRunInput): Promise<unknown> =>
  runRust(input, 'io_write_calls_count');
