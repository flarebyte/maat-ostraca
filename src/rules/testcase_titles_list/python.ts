import { runPython } from '../_shared/python/analyse.js';
import type { RuleRunInput } from '../dispatch.js';
export const run = async (input: RuleRunInput): Promise<unknown> =>
  runPython(input, 'testcase_titles_list');
