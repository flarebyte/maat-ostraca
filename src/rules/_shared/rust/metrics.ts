import { createHash } from 'node:crypto';
import type { FileMetricsResult } from '../common.js';
import type { RustNode } from './ast.js';

export const rustHash = (source: string): string =>
  createHash('sha256').update(source).digest('hex');
// Syntax-only approximation, consistent with the shared v1 complexity contract.
// Nested functions/closures contribute to enclosing metrics, as in existing languages.
export const rustMetrics = (
  node: RustNode,
  source = node.text(),
): FileMetricsResult & { returnCount: number } => {
  let loops = 0;
  let conditions = 0;
  let tokens = 0;
  let maxNestingDepth = 0;
  let returnCount = 0;
  const visit = (current: RustNode, depth: number): void => {
    const kind = String(current.kind());
    if (['line_comment', 'block_comment'].includes(kind)) return;
    const nextDepth =
      depth +
      (['block', 'match_block', 'declaration_list'].includes(kind) ? 1 : 0);
    maxNestingDepth = Math.max(maxNestingDepth, nextDepth);
    if (
      ['for_expression', 'while_expression', 'loop_expression'].includes(kind)
    )
      loops++;
    if (kind === 'if_expression') conditions++;
    if (kind === 'match_arm' && current.field('pattern')?.text().trim() !== '_')
      conditions++;
    if (kind === 'match_pattern' && current.field('condition')) conditions++;
    if (kind === 'return_expression') returnCount++;
    if (
      ['string_literal', 'raw_string_literal', 'char_literal'].includes(kind)
    ) {
      tokens++;
      return;
    }
    const children = current.children();
    if (!children.length && current.text().trim()) tokens++;
    else for (const child of children) visit(child, nextDepth);
  };
  visit(node, 0);
  const complexity = source.length ? 1 + loops + conditions : 0;
  return {
    loc: source ? source.split('\n').length : 0,
    sloc: source.split('\n').filter((line) => line.trim()).length,
    loops,
    conditions,
    cyclomaticComplexity: complexity,
    cognitiveComplexity: complexity,
    maxNestingDepth,
    tokens,
    returnCount,
  };
};
