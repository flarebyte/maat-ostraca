import type { SgNode } from '@ast-grep/napi';
import { kind, Lang } from '@ast-grep/napi';
import {
  collectDeclarationModifiers,
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

    symbols.push({
      name,
      modifiers: collectDeclarationModifiers(node, { includeAsync: true }),
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

    symbols.push({
      name,
      modifiers: collectDeclarationModifiers(declarator, {
        includeAsync: true,
        asyncNode: expressionNode,
      }),
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
