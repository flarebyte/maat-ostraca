import { descendants, fieldText, named, type RustNode, sorted } from './ast.js';

export interface RustImport {
  path: string;
  alias: string;
}
const join = (prefix: string, name: string): string =>
  name === 'self' && prefix ? prefix : prefix ? `${prefix}::${name}` : name;
const expand = (node: RustNode, prefix = ''): RustImport[] => {
  const kind = node.kind();
  if (kind === 'scoped_use_list') {
    const list = node.field('list');
    return list ? expand(list, join(prefix, fieldText(node, 'path'))) : [];
  }
  if (kind === 'use_list')
    return named(node).flatMap((child) => expand(child, prefix));
  if (kind === 'use_as_clause')
    return [
      {
        path: join(prefix, fieldText(node, 'path')),
        alias: fieldText(node, 'alias'),
      },
    ];
  if (kind === 'use_wildcard')
    return [{ path: join(prefix, node.text().replace(/\s/g, '')), alias: '*' }];
  const path = join(prefix, node.text().replace(/\s/g, ''));
  return [{ path, alias: path.split('::').at(-1) ?? '' }];
};
export const rustImports = (root: RustNode): RustImport[] => [
  ...descendants(root, 'use_declaration').flatMap((node) =>
    named(node)
      .filter((child) => child.kind() !== 'visibility_modifier')
      .flatMap((child) => expand(child)),
  ),
  ...descendants(root, 'extern_crate_declaration').map((node) => ({
    path: fieldText(node, 'name'),
    alias: fieldText(node, 'alias') || fieldText(node, 'name'),
  })),
];
export const importPaths = (root: RustNode): string[] =>
  sorted(rustImports(root).map((item) => item.path));
export const packagePaths = (root: RustNode): string[] =>
  sorted(
    rustImports(root)
      .map((item) => item.path.replace(/^::/, '').split('::')[0] ?? '')
      .filter((path) => path && !['crate', 'self', 'super'].includes(path)),
  );
export const resolveRustName = (root: RustNode) => {
  const aliases = new Map(
    rustImports(root)
      .filter((item) => item.alias !== '*' && item.alias !== '_')
      .map((item) => [item.alias, item.path]),
  );
  return (name: string): string => {
    const clean = name.replace(/^::/, '');
    const [head = '', ...tail] = clean.split('::');
    return [aliases.get(head) ?? head, ...tail].join('::');
  };
};
