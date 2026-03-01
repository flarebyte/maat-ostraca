import type { SgNode } from '@ast-grep/napi';
import { kind, Lang } from '@ast-grep/napi';
import {
  compareLex,
  hasChildKind,
  lowerCamel,
  parseAccessibilityModifier,
  parseParams,
  parseReturns,
  textOfFirstChild,
} from './common.js';
import type { MethodSymbol } from './types.js';

export const collectMethodSymbols = (root: SgNode): MethodSymbol[] => {
  const methods: MethodSymbol[] = [];
  const methodNodes = root.findAll(kind(Lang.TypeScript, 'method_definition'));

  for (const node of methodNodes) {
    const methodName = textOfFirstChild(node, 'property_identifier');
    if (!methodName) {
      continue;
    }

    const classNode = node
      .ancestors()
      .find(
        (ancestor) =>
          ancestor.kind() === 'class_declaration' ||
          ancestor.kind() === 'abstract_class_declaration',
      );
    if (!classNode) {
      continue;
    }

    const receiver =
      textOfFirstChild(classNode, 'type_identifier') ??
      textOfFirstChild(classNode, 'identifier');

    if (!receiver) {
      continue;
    }

    const modifiers = new Set<string>();
    const accessibility = parseAccessibilityModifier(node);
    if (accessibility) {
      modifiers.add(accessibility);
    }
    if (hasChildKind(node, 'static')) {
      modifiers.add('static');
    }
    if (hasChildKind(node, 'async')) {
      modifiers.add('async');
    }
    if (hasChildKind(node, 'override')) {
      modifiers.add('override');
    }

    methods.push({
      key: `${lowerCamel(receiver)}${methodName}`,
      receiver,
      name: methodName,
      modifiers: [...modifiers].sort(compareLex),
      params: parseParams(node),
      returns: parseReturns(node),
      code: node.text(),
    });
  }

  return methods;
};
