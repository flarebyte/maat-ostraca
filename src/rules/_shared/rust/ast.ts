import { parse, type SgNode } from '@ast-grep/napi';
import { ensureDynamicLanguages } from '../../../core/astgrep/languages.js';
import { InternalError } from '../../../core/errors/index.js';
import type { RuleRunInput } from '../../dispatch.js';

export type RustNode = SgNode;
export const parseRust = (input: RuleRunInput): RustNode => {
  if (input.language !== 'rust')
    throw new InternalError(
      `rust_analysis_error: unsupported language "${input.language}"`,
    );
  ensureDynamicLanguages();
  try {
    return parse('rust', input.source).root();
  } catch {
    throw new InternalError('rust_analysis_error: failed to parse source');
  }
};
export const named = (node: RustNode): RustNode[] =>
  node.children().filter((child) => child.isNamed());
export const descendants = (node: RustNode, kind: string): RustNode[] =>
  node.findAll({ rule: { kind } });
export const sorted = (values: string[]): string[] =>
  [...new Set(values)].sort();
export const fieldText = (node: RustNode, field: string): string =>
  node.field(field)?.text() ?? '';
export const attributes = (node: RustNode): string[] => {
  const values: string[] = [];
  let previous = node.prev();
  while (
    previous &&
    ['attribute_item', 'line_comment', 'block_comment'].includes(
      String(previous.kind()),
    )
  ) {
    if (previous.kind() === 'attribute_item') values.unshift(previous.text());
    previous = previous.prev();
  }
  return values;
};
export const modifiers = (node: RustNode): string[] =>
  node.children().flatMap((child) => {
    if (child.kind() === 'visibility_modifier') return [child.text()];
    if (child.kind() === 'function_modifiers')
      return (
        child.text().match(/async|unsafe|const|extern(?:\s+"[^"]*")?/g) ?? []
      );
    return child.text() === 'unsafe' ? ['unsafe'] : [];
  });
// Preserve literal values; never evaluate source or expand macros.
export const stringValue = (node: RustNode | null): string | undefined => {
  if (!node) return undefined;
  const text = node.text();
  if (node.kind() === 'raw_string_literal')
    return text.match(/^r(#{0,255})"([\s\S]*)"\1$/)?.[2];
  if (node.kind() !== 'string_literal' || !text.startsWith('"'))
    return undefined;
  return text
    .slice(1, -1)
    .replace(
      /\\(?:u\{([\da-fA-F_]+)\}|x([\da-fA-F]{2})|([nrt0\\"'])|\r?\n\s*)/g,
      (
        _match,
        unicode: string | undefined,
        hex: string | undefined,
        escapeCode: string | undefined,
      ) => {
        if (unicode) {
          const code = Number.parseInt(unicode.replaceAll('_', ''), 16);
          return code <= 0x10ffff ? String.fromCodePoint(code) : '\uFFFD';
        }
        if (hex) return String.fromCharCode(Number.parseInt(hex, 16));
        return escapeCode
          ? ({ n: '\n', r: '\r', t: '\t', '0': '\0' }[escapeCode] ?? escapeCode)
          : '';
      },
    );
};
