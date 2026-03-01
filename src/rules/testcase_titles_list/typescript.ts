import type { SgNode } from '@ast-grep/napi';
import { kind, Lang } from '@ast-grep/napi';
import { runTypeScriptStringListRule } from '../_shared/typescript/rule_support.js';
import { readLiteralString } from '../_shared/typescript/string_literals.js';
import type { RuleRunInput } from '../dispatch.js';

const isAllowedTestCallee = (calleeText: string): boolean => {
  return [
    'describe',
    'it',
    'test',
    'describe.only',
    'describe.skip',
    'it.only',
    'it.skip',
    'test.only',
    'test.skip',
  ].includes(calleeText);
};

const firstArgumentNode = (argumentsNode: SgNode): SgNode | undefined => {
  return argumentsNode
    .children()
    .find((child) => !['(', ')', ','].includes(String(child.kind())));
};

const readFirstLiteralArgument = (callNode: SgNode): string | undefined => {
  const argumentsNode = callNode
    .children()
    .find((child) => String(child.kind()) === 'arguments');
  if (!argumentsNode) {
    return undefined;
  }

  const firstArg = firstArgumentNode(argumentsNode);
  if (!firstArg) {
    return undefined;
  }

  return readLiteralString(firstArg);
};

export const run = async (input: RuleRunInput): Promise<string[]> => {
  return runTypeScriptStringListRule({
    input,
    messages: {
      unsupported: `testcase_titles_extract_error: unsupported language "${input.language}"`,
      failed: 'testcase_titles_extract_error: failed to extract titles',
    },
    extract: (root) => {
      const calls = root.findAll(kind(Lang.TypeScript, 'call_expression'));
      const titles: string[] = [];

      for (const call of calls) {
        const calleeNode = call
          .children()
          .find((child) => String(child.kind()) !== 'arguments');
        if (!calleeNode) {
          continue;
        }

        const calleeText = calleeNode.text().trim();
        if (!isAllowedTestCallee(calleeText)) {
          continue;
        }

        const title = readFirstLiteralArgument(call);
        if (title !== undefined) {
          titles.push(title);
        }
      }

      return titles;
    },
  });
};
