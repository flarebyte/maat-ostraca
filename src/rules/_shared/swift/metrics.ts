import { measureSyntax } from '../syntax_metrics.js';
import type { SwiftNode } from './ast.js';
export const swiftMetrics = (node: SwiftNode, source = node.text()) =>
  measureSyntax(node, source, {
    comments: ['comment', 'multiline_comment'],
    blocks: [],
    blockDepth: (current) =>
      Number(
        [
          'function_body',
          'class_body',
          'protocol_body',
          'enum_class_body',
        ].includes(String(current.kind())) ||
          (current.kind() === 'statements' &&
            current.parent()?.kind() !== 'function_body'),
      ),
    literals: [
      'line_string_literal',
      'multi_line_string_literal',
      'raw_string_literal',
    ],
    loops: ['for_statement', 'while_statement', 'repeat_while_statement'],
    conditions: (current) =>
      Number(
        ['if_statement', 'guard_statement', 'ternary_expression'].includes(
          String(current.kind()),
        ),
      ) +
      Number(
        current.kind() === 'switch_entry' &&
          current.children().some((child) => child.text() === 'case'),
      ),
    isReturn: (current) =>
      current.kind() === 'control_transfer_statement' &&
      current.children().some((child) => child.text() === 'return'),
  });
