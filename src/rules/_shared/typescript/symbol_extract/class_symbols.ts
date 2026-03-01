import type { SgNode } from '@ast-grep/napi';
import { kind, Lang } from '@ast-grep/napi';
import {
  compareLex,
  hasChildKind,
  hasDefaultModifier,
  hasExportModifier,
  textOfFirstChild,
} from './common.js';
import type { ClassSymbol } from './types.js';

export const collectClassSymbols = (root: SgNode): ClassSymbol[] => {
  const classes: ClassSymbol[] = [];
  const classNodes = [
    ...root.findAll(kind(Lang.TypeScript, 'class_declaration')),
    ...root.findAll(kind(Lang.TypeScript, 'abstract_class_declaration')),
  ];

  for (const node of classNodes) {
    const name =
      textOfFirstChild(node, 'type_identifier') ??
      textOfFirstChild(node, 'identifier');
    if (!name) {
      continue;
    }

    const modifiers = new Set<string>();
    if (hasExportModifier(node)) {
      modifiers.add('export');
    }
    if (hasDefaultModifier(node)) {
      modifiers.add('default');
    }
    if (
      node.kind() === 'abstract_class_declaration' ||
      hasChildKind(node, 'abstract')
    ) {
      modifiers.add('abstract');
    }

    const heritage = node
      .children()
      .find((child) => child.kind() === 'class_heritage');

    const extendsName = heritage
      ?.children()
      .find((child) => child.kind() === 'extends_clause')
      ?.children()
      .find((child) => child.kind() !== 'extends')
      ?.text();

    const implementsNames =
      heritage
        ?.children()
        .find((child) => child.kind() === 'implements_clause')
        ?.children()
        .filter(
          (child) =>
            child.kind() === 'type_identifier' || child.kind() === 'identifier',
        )
        .map((child) => child.text()) ?? [];

    const classBody = node
      .children()
      .find((child) => child.kind() === 'class_body');

    const methodCount =
      classBody
        ?.children()
        .filter((child) => hasChildKind(child, 'property_identifier')).length ??
      0;

    classes.push({
      name,
      modifiers: [...modifiers].sort(compareLex),
      ...(extendsName ? { extendsName } : {}),
      implementsNames: [...implementsNames].sort(compareLex),
      methodCount,
      code: node.text(),
    });
  }

  return classes;
};
