import type { SgNode } from '@ast-grep/napi';

const isTemplateWithoutExpressions = (node: SgNode): boolean => {
  if (String(node.kind()) !== 'template_string') {
    return false;
  }

  return !node
    .children()
    .some((child) => String(child.kind()) === 'template_substitution');
};

export const readLiteralString = (node: SgNode): string | undefined => {
  const kind = String(node.kind());
  if (kind !== 'string' && !isTemplateWithoutExpressions(node)) {
    return undefined;
  }

  const literalText = node.text();

  // The node text is guaranteed to be a literal token from ast-grep,
  // so evaluating it as an expression yields deterministic JS string value.
  return Function(`"use strict"; return (${literalText});`)() as string;
};
