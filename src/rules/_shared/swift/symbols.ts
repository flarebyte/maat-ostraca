import {
  children,
  nodes,
  type SwiftNode,
  swiftModifiers,
  textField,
  unique,
} from './ast.js';

const functionKinds = [
  'function_declaration',
  'init_declaration',
  'deinit_declaration',
];
export const swiftFunctions = (root: SwiftNode): SwiftNode[] =>
  functionKinds
    .flatMap((kind) => nodes(root, kind))
    .sort((a, b) => a.range().start.index - b.range().start.index);
export const swiftName = (node: SwiftNode): string =>
  textField(node, 'name') ||
  (node.kind() === 'deinit_declaration' ? 'deinit' : '');
export const ownKey = (node: SwiftNode): string => {
  const generics =
    children(node)
      .find((child) => child.kind() === 'type_parameters')
      ?.text() ?? '';
  const params = children(node)
    .filter((child) => child.kind() === 'parameter')
    .map(
      (param) =>
        `${textField(param, 'external_name') || textField(param, 'name')}:${textField(param, 'type')}`,
    );
  const returns = textField(node, 'return_type');
  return `${swiftName(node)}${generics}(${params.join(',')})${returns ? `->${returns}` : ''}`;
};
export const receiver = (node: SwiftNode): string => {
  const parts: string[] = [];
  let parent = node.parent();
  let typeSeen = false;
  while (parent) {
    if (functionKinds.includes(String(parent.kind()))) {
      if (!typeSeen) return '';
      parts.unshift(ownKey(parent));
    }
    if (
      ['class_declaration', 'protocol_declaration'].includes(
        String(parent.kind()),
      )
    ) {
      typeSeen = true;
      parts.unshift(textField(parent, 'name'));
    }
    parent = parent.parent();
  }
  return parts.join('.');
};
export const swiftKey = (node: SwiftNode): string => {
  const enclosing: string[] = [];
  let parent = node.parent();
  while (parent) {
    if (functionKinds.includes(String(parent.kind())))
      enclosing.unshift(ownKey(parent));
    if (
      ['class_declaration', 'protocol_declaration'].includes(
        String(parent.kind()),
      )
    )
      enclosing.unshift(textField(parent, 'name'));
    parent = parent.parent();
  }
  return [...enclosing, ownKey(node)].filter(Boolean).join('.');
};
export const swiftSignature = (node: SwiftNode) => ({
  modifiers: swiftModifiers(node),
  params: children(node)
    .filter((child) => child.kind() === 'parameter')
    .map((child) => child.text()),
  returns: node.field('return_type') ? [textField(node, 'return_type')] : [],
});
export const inheritedNames = (node: SwiftNode): string[] =>
  children(node)
    .filter((child) => child.kind() === 'inheritance_specifier')
    .map((child) => child.text());
export const swiftProtocols = (root: SwiftNode) =>
  nodes(root, 'protocol_declaration').map((node) => ({
    name: textField(node, 'name'),
    modifiers: swiftModifiers(node),
    extendsNames: unique(inheritedNames(node)),
    methods: unique(
      nodes(node, 'protocol_function_declaration').map((method) =>
        method.text(),
      ),
    ),
    code: node.text(),
  }));
