import type { SgNode } from '@ast-grep/napi';
import { kind, Lang } from '@ast-grep/napi';
import {
  compareLex,
  hasChildKind,
  hasDefaultModifier,
  hasExportModifier,
  isFunctionExpressionKind,
  parseParams,
  parseReturns,
  textOfFirstChild,
} from './common.js';
import type { FunctionSymbol } from './types.js';

const collectFunctionDeclarationSymbols = (root: SgNode): FunctionSymbol[] => {
  const symbols: FunctionSymbol[] = [];
  const nodes = root.findAll(kind(Lang.TypeScript, 'function_declaration'));

  for (const node of nodes) {
    const name = textOfFirstChild(node, 'identifier');
    if (!name) {
      continue;
    }

    const modifiers = new Set<string>();
    if (hasExportModifier(node)) {
      modifiers.add('export');
    }
    if (hasDefaultModifier(node)) {
      modifiers.add('default');
    }
    if (hasChildKind(node, 'async')) {
      modifiers.add('async');
    }

    symbols.push({
      name,
      modifiers: [...modifiers].sort(compareLex),
      params: parseParams(node),
      returns: parseReturns(node),
      code: node.text(),
    });
  }

  return symbols;
};

const collectVariableFunctionSymbols = (root: SgNode): FunctionSymbol[] => {
  const symbols: FunctionSymbol[] = [];
  const declarators = root.findAll(
    kind(Lang.TypeScript, 'variable_declarator'),
  );

  for (const declarator of declarators) {
    const name = textOfFirstChild(declarator, 'identifier');
    if (!name) {
      continue;
    }

    const expressionNode = declarator
      .children()
      .find((child) => isFunctionExpressionKind(String(child.kind())));

    if (!expressionNode) {
      continue;
    }

    const modifiers = new Set<string>();
    if (hasExportModifier(declarator)) {
      modifiers.add('export');
    }
    if (hasDefaultModifier(declarator)) {
      modifiers.add('default');
    }
    if (hasChildKind(expressionNode, 'async')) {
      modifiers.add('async');
    }

    symbols.push({
      name,
      modifiers: [...modifiers].sort(compareLex),
      params: parseParams(expressionNode),
      returns: parseReturns(expressionNode),
      code: expressionNode.text(),
    });
  }

  return symbols;
};

export const collectFunctionSymbols = (root: SgNode): FunctionSymbol[] => {
  return [
    ...collectFunctionDeclarationSymbols(root),
    ...collectVariableFunctionSymbols(root),
  ];
};
