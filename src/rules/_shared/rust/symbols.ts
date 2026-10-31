import {
  attributes,
  descendants,
  fieldText,
  modifiers,
  named,
  type RustNode,
  sorted,
} from './ast.js';

const containerName = (node: RustNode): string => {
  if (node.kind() === 'impl_item') {
    const type = fieldText(node, 'type');
    const trait = fieldText(node, 'trait');
    return trait ? `<${type} as ${trait}>` : type;
  }
  return fieldText(node, 'name');
};
export const symbolKey = (node: RustNode): string => {
  const parents: string[] = [];
  let parent = node.parent();
  while (parent) {
    if (
      ['mod_item', 'function_item', 'impl_item', 'trait_item'].includes(
        String(parent.kind()),
      )
    )
      parents.unshift(containerName(parent));
    parent = parent.parent();
  }
  return [...parents, fieldText(node, 'name')].filter(Boolean).join('::');
};
export const isRustMethod = (node: RustNode): boolean => {
  let parent = node.parent();
  while (parent) {
    if (parent.kind() === 'function_item') return false;
    if (parent.kind() === 'impl_item' || parent.kind() === 'trait_item')
      return true;
    parent = parent.parent();
  }
  return false;
};
export const rustFunctions = (root: RustNode): RustNode[] =>
  descendants(root, 'function_item');
export const signature = (node: RustNode) => ({
  modifiers: modifiers(node),
  params: (node.field('parameters')?.children() ?? [])
    .filter(
      (child) =>
        child.isNamed() &&
        !['line_comment', 'block_comment'].includes(String(child.kind())),
    )
    .map((child) => child.text()),
  returns: node.field('return_type') ? [fieldText(node, 'return_type')] : [],
});
export const rustInterfaces = (root: RustNode) =>
  descendants(root, 'trait_item').map((node) => {
    const body = node.field('body');
    const bounds = node.field('bounds');
    return {
      name: symbolKey(node),
      modifiers: modifiers(node),
      extendsNames: bounds
        ? sorted(named(bounds).map((bound) => bound.text()))
        : [],
      methods: body
        ? sorted(
            named(body)
              .filter((child) =>
                ['function_item', 'function_signature_item'].includes(
                  String(child.kind()),
                ),
              )
              .map((child) => {
                const block = child.field('body');
                return block
                  ? `${child.text().slice(0, -block.text().length).trimEnd()};`
                  : child.text();
              }),
          )
        : [],
      code: node.text(),
    };
  });
export const rustTests = (root: RustNode): string[] =>
  sorted(
    rustFunctions(root)
      .filter((node) =>
        attributes(node).some((attribute) =>
          /^#\[\s*(?:test|tokio::test|async_std::test)\s*(?:\(|\])/.test(
            attribute,
          ),
        ),
      )
      .map(symbolKey),
  );
