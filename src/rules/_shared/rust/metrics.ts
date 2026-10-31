import { createHash } from 'node:crypto';
import { measureSyntax } from '../syntax_metrics.js';
import type { RustNode } from './ast.js';
export const rustHash = (source: string): string =>
  createHash('sha256').update(source).digest('hex');
export const rustMetrics = (node: RustNode, source = node.text()) =>
  measureSyntax(node, source, {
    comments: ['line_comment', 'block_comment'],
    blocks: ['block', 'match_block', 'declaration_list'],
    literals: ['string_literal', 'raw_string_literal', 'char_literal'],
    loops: ['for_expression', 'while_expression', 'loop_expression'],
    conditions: (current) =>
      Number(current.kind() === 'if_expression') +
      Number(
        current.kind() === 'match_arm' &&
          current.field('pattern')?.text().trim() !== '_',
      ) +
      Number(
        current.kind() === 'match_pattern' && !!current.field('condition'),
      ),
    isReturn: (current) => current.kind() === 'return_expression',
  });
