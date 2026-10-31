import { parse, type SgNode } from '@ast-grep/napi';
import { ensureDynamicLanguages } from '../../../core/astgrep/languages.js';
import { InternalError } from '../../../core/errors/index.js';
import type { RuleRunInput } from '../../dispatch.js';
export type SwiftNode = SgNode;
export const children = (node: SwiftNode): SwiftNode[] =>
  node
    .children()
    .filter(
      (child) =>
        child.isNamed() &&
        !['comment', 'multiline_comment'].includes(String(child.kind())),
    );
export const nodes = (node: SwiftNode, kind: string): SwiftNode[] =>
  node.findAll({ rule: { kind } });
export const unique = (values: string[]): string[] =>
  [...new Set(values)].sort();
export const textField = (node: SwiftNode, field: string): string =>
  node.field(field)?.text() ?? '';
export const swiftRoot = (input: RuleRunInput): SwiftNode => {
  if (input.language !== 'swift')
    throw new InternalError(
      `swift_analysis_error: unsupported language "${input.language}"`,
    );
  ensureDynamicLanguages();
  return parse('swift', input.source).root();
};
export const literal = (node: SwiftNode | undefined): string | undefined => {
  if (
    !node ||
    ![
      'line_string_literal',
      'multi_line_string_literal',
      'raw_string_literal',
    ].includes(String(node.kind()))
  )
    return undefined;
  const source = node.text();
  const match = source.match(/^(#*)("""|")([\s\S]*)\2\1$/);
  if (!match) return undefined;
  const hashes = match[1] ?? '';
  let value = match[3] ?? '';
  for (let index = 0; index < value.length; index++) {
    if (value[index] !== '\\' || !value.slice(index + 1).startsWith(hashes))
      continue;
    const marker = index + 1 + hashes.length;
    if (value[marker] === '(') return undefined;
    if (!hashes && value[marker] === '\\') index = marker;
  }
  if (match[2] === '"""') {
    // Swift multiline indentation is determined by the closing delimiter.
    const indent = value.match(/\n([ \t]*)$/)?.[1] ?? '';
    value = value
      .replace(/^\r?\n/, '')
      .replace(/\r?\n[ \t]*$/, '')
      .split('\n')
      .map((line) =>
        line.startsWith(indent) ? line.slice(indent.length) : line,
      )
      .join('\n');
  }
  return value.replace(
    new RegExp(`\\\\${hashes}(?:u\\{([0-9a-fA-F]+)\\}|([nrt0"'\\\\]))`, 'g'),
    (_match, unicode: string | undefined, escapeCode: string | undefined) =>
      unicode
        ? String.fromCodePoint(Math.min(Number.parseInt(unicode, 16), 0x10ffff))
        : ({ n: '\n', r: '\r', t: '\t', '0': '\0' }[escapeCode ?? ''] ??
          escapeCode ??
          ''),
  );
};
export const swiftImports = (root: SwiftNode): string[] =>
  unique(
    nodes(root, 'import_declaration').flatMap((node) =>
      children(node)
        .filter((child) => child.kind() === 'identifier')
        .map((child) => child.text().replace(/\s/g, '')),
    ),
  );
export const swiftModifiers = (node: SwiftNode): string[] => {
  const group = children(node).find((child) => child.kind() === 'modifiers');
  return [
    ...(group
      ? children(group)
          .filter((child) => child.kind() !== 'attribute')
          .map((child) => child.text())
      : []),
    ...node
      .children()
      .filter((child) => ['async', 'throws', 'rethrows'].includes(child.text()))
      .map((child) => child.text()),
  ];
};
