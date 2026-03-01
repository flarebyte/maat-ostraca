import type { SgNode } from '@ast-grep/napi';
import { Lang, parse } from '@ast-grep/napi';
import { runAstGrepWithTimeout } from '../../../core/astgrep/timeout.js';
import { InternalError } from '../../../core/errors/index.js';
import type { RuleRunInput } from '../../dispatch.js';

export const sortedDedupStrings = (values: string[]): string[] => {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
};

interface StringListRuleMessages {
  unsupported: string;
  failed: string;
}

interface RunTypeScriptStringListRuleInput {
  input: RuleRunInput;
  messages: StringListRuleMessages;
  extract: (root: SgNode) => string[];
}

export const runTypeScriptStringListRule = async ({
  input,
  messages,
  extract,
}: RunTypeScriptStringListRuleInput): Promise<string[]> => {
  if (input.language !== 'typescript') {
    throw new InternalError(messages.unsupported);
  }

  try {
    const root = await runAstGrepWithTimeout(async () =>
      parse(Lang.TypeScript, input.source).root(),
    );
    return sortedDedupStrings(extract(root));
  } catch (error: unknown) {
    if (error instanceof InternalError) {
      throw error;
    }

    throw new InternalError(messages.failed);
  }
};
