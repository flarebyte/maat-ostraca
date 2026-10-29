import { runPython } from '../_shared/python/analyse.js';
import type { RuleRunInput } from '../dispatch.js';
export const run = async (input: RuleRunInput): Promise<unknown> =>
  runPython(input, 'io_read_calls_count');
