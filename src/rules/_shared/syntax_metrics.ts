import type { SgNode } from '@ast-grep/napi';
import type { FileMetricsResult } from './common.js';
export interface SyntaxMetricRules {
  comments: readonly string[];
  blockDepth?: (node: SgNode) => number;
  blocks: readonly string[];
  literals: readonly string[];
  loops: readonly string[];
  conditions: (node: SgNode) => number;
  isReturn: (node: SgNode) => boolean;
}
export const measureSyntax = (
  node: SgNode,
  source: string,
  rules: SyntaxMetricRules,
): FileMetricsResult & { returnCount: number } => {
  let loops = 0,
    conditions = 0,
    tokens = 0,
    maxNestingDepth = 0,
    returnCount = 0;
  const visit = (current: SgNode, depth: number): void => {
    const kind = String(current.kind());
    if (rules.comments.includes(kind)) return;
    const level =
      depth +
      (rules.blockDepth
        ? rules.blockDepth(current)
        : Number(rules.blocks.includes(kind)));
    maxNestingDepth = Math.max(maxNestingDepth, level);
    loops += Number(rules.loops.includes(kind));
    conditions += rules.conditions(current);
    returnCount += Number(rules.isReturn(current));
    if (rules.literals.includes(kind)) {
      tokens++;
      return;
    }
    const children = current.children();
    if (!children.length && current.text().trim()) tokens++;
    else for (const child of children) visit(child, level);
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
