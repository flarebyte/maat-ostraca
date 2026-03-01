import type { SgNode } from '@ast-grep/napi';
import { kind, Lang } from '@ast-grep/napi';
import { runTypeScriptStringListRule } from '../_shared/typescript/rule_support.js';
import { readLiteralString } from '../_shared/typescript/string_literals.js';
import type { RuleRunInput } from '../dispatch.js';

const compact = (value: string): string => value.replace(/\s+/g, '');

const isProcessEnvObject = (node: SgNode): boolean => {
  if (String(node.kind()) !== 'member_expression') {
    return false;
  }

  const text = compact(node.text());
  return text === 'process.env' || text === 'process?.env';
};

const findMemberObject = (node: SgNode): SgNode | undefined => {
  return node
    .children()
    .find((child) => String(child.kind()) === 'member_expression');
};

const findPropertyIdentifier = (node: SgNode): SgNode | undefined => {
  return [...node.children()]
    .reverse()
    .find((child) => String(child.kind()) === 'property_identifier');
};

const findLiteralIndexNode = (node: SgNode): SgNode | undefined => {
  return node.children().find((child) => {
    const childKind = String(child.kind());
    return childKind === 'string' || childKind === 'template_string';
  });
};

const collectDotAccessEnvNames = (root: SgNode): string[] => {
  const names: string[] = [];
  const nodes = root.findAll(kind(Lang.TypeScript, 'member_expression'));

  for (const node of nodes) {
    const objectNode = findMemberObject(node);
    const propertyNode = findPropertyIdentifier(node);

    if (!objectNode || !propertyNode || !isProcessEnvObject(objectNode)) {
      continue;
    }

    const name = propertyNode.text().trim();
    if (name !== '') {
      names.push(name);
    }
  }

  return names;
};

const collectBracketAccessEnvNames = (root: SgNode): string[] => {
  const names: string[] = [];
  const nodes = root.findAll(kind(Lang.TypeScript, 'subscript_expression'));

  for (const node of nodes) {
    const objectNode = findMemberObject(node);
    if (!objectNode || !isProcessEnvObject(objectNode)) {
      continue;
    }

    const indexNode = findLiteralIndexNode(node);
    if (!indexNode) {
      continue;
    }

    const literal = readLiteralString(indexNode);
    if (literal !== undefined && literal !== '') {
      names.push(literal);
    }
  }

  return names;
};

export const run = async (input: RuleRunInput): Promise<string[]> => {
  return runTypeScriptStringListRule({
    input,
    messages: {
      unsupported: `env_names_extract_error: unsupported language "${input.language}"`,
      failed: 'env_names_extract_error: failed to extract names',
    },
    extract: (root) => {
      const dotNames = collectDotAccessEnvNames(root);
      const bracketNames = collectBracketAccessEnvNames(root);
      return [...dotNames, ...bracketNames];
    },
  });
};
