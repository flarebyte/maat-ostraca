import { runSwift } from '../_shared/swift/analyse.js';
import type { RuleRunInput } from '../dispatch.js';
export const run = async (input: RuleRunInput): Promise<unknown> =>
  runSwift(input, 'testcase_titles_list');
