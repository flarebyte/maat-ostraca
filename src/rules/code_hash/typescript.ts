import { createHash } from 'node:crypto';
import type { RuleRunInput } from '../dispatch.js';

interface CodeHashResult {
  algorithm: 'sha256';
  file: string;
}

export const run = async (input: RuleRunInput): Promise<CodeHashResult> => {
  void input.filename;
  void input.language;

  const file = createHash('sha256').update(input.source, 'utf8').digest('hex');
  return {
    algorithm: 'sha256',
    file,
  };
};
