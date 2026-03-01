import type { SgNode } from '@ast-grep/napi';
import { kind, Lang } from '@ast-grep/napi';
import { compareLex, hasExportModifier, textOfFirstChild } from './common.js';
import type { InterfaceSymbol } from './types.js';

export const collectInterfaceSymbols = (root: SgNode): InterfaceSymbol[] => {
  const interfaces: InterfaceSymbol[] = [];
  const interfaceNodes = root.findAll(
    kind(Lang.TypeScript, 'interface_declaration'),
  );

  for (const node of interfaceNodes) {
    const name = textOfFirstChild(node, 'type_identifier');
    if (!name) {
      continue;
    }

    const modifiers = new Set<string>();
    if (hasExportModifier(node)) {
      modifiers.add('export');
    }

    const extendsNames =
      node
        .children()
        .find((child) => child.kind() === 'extends_type_clause')
        ?.children()
        .filter((child) => child.kind() === 'type_identifier')
        .map((child) => child.text()) ?? [];

    const methods =
      node
        .children()
        .find((child) => child.kind() === 'interface_body')
        ?.children()
        .filter((child) => child.kind() === 'method_signature')
        .map((child) => child.text().trim()) ?? [];

    interfaces.push({
      name,
      modifiers: [...modifiers].sort(compareLex),
      extendsNames: [...extendsNames].sort(compareLex),
      methods: [...methods].sort(compareLex),
      code: node.text(),
    });
  }

  return interfaces;
};
