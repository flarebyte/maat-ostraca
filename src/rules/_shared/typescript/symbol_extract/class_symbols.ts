import type { SgNode } from '@ast-grep/napi';
import { kind, Lang } from '@ast-grep/napi';
import {
  collectDeclarationModifiers,
  compareLex,
  hasChildKind,
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
      modifiers: collectDeclarationModifiers(node, {
        includeAbstract: true,
        abstractKinds: ['abstract_class_declaration'],
      }),
      ...(extendsName ? { extendsName } : {}),
      implementsNames: [...implementsNames].sort(compareLex),
      methodCount,
      code: node.text(),
    });
  }

  return classes;
};
