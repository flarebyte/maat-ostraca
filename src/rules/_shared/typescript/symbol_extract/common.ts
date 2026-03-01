import type { SgNode } from '@ast-grep/napi';
import { Lang } from '@ast-grep/napi';
import type { Language } from '../../../../core/contracts/language.js';
import { InternalError } from '../../../../core/errors/index.js';

export const compareLex = (a: string, b: string): number => a.localeCompare(b);

export const toAstLanguage = (language: Language): Lang => {
  if (language === 'typescript') {
    return Lang.TypeScript;
  }

  throw new InternalError(
    `symbol_extract_error: unsupported language "${language}"`,
  );
};

export const lowerCamel = (value: string): string => {
  return value.length === 0
    ? value
    : value.charAt(0).toLowerCase() + value.slice(1);
};

export const textOfFirstChild = (
  node: SgNode,
  kindName: string,
): string | undefined => {
  return node
    .children()
    .find((child) => child.kind() === kindName)
    ?.text();
};

export const isFunctionExpressionKind = (kindName: string): boolean => {
  return kindName === 'arrow_function' || kindName === 'function_expression';
};

const isParameterKind = (kindName: string): boolean => {
  return (
    kindName === 'required_parameter' ||
    kindName === 'optional_parameter' ||
    kindName === 'rest_parameter' ||
    kindName === 'this_parameter'
  );
};

export const parseParams = (node: SgNode): string[] => {
  const formal = node
    .children()
    .find((child) => child.kind() === 'formal_parameters');
  if (!formal) {
    return [];
  }

  return formal
    .children()
    .filter((child) => isParameterKind(String(child.kind())))
    .map((child) => child.text().trim());
};

export const parseReturns = (node: SgNode): string[] => {
  const annotation = node
    .children()
    .find((child) => child.kind() === 'type_annotation');
  if (!annotation) {
    return [];
  }

  const text = annotation.text().trim();
  if (!text.startsWith(':')) {
    return [text];
  }

  return [text.slice(1).trim()];
};

export const parseAccessibilityModifier = (
  node: SgNode,
): string | undefined => {
  const modifier = node
    .children()
    .find((child) => child.kind() === 'accessibility_modifier');
  if (!modifier) {
    return undefined;
  }

  const keyword = modifier
    .children()
    .find((child) =>
      ['public', 'private', 'protected'].includes(String(child.kind())),
    );

  return keyword?.text();
};

export const hasChildKind = (node: SgNode, kindName: string): boolean => {
  return node.children().some((child) => child.kind() === kindName);
};

const hasAncestorKind = (node: SgNode, kindName: string): boolean => {
  return node.ancestors().some((ancestor) => ancestor.kind() === kindName);
};

export const hasExportModifier = (node: SgNode): boolean => {
  return hasAncestorKind(node, 'export_statement');
};

export const hasDefaultModifier = (node: SgNode): boolean => {
  return node
    .ancestors()
    .some(
      (ancestor) =>
        ancestor.kind() === 'export_statement' &&
        hasChildKind(ancestor, 'default'),
    );
};

export const sortByName = <T extends { name: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
};

export const sortByKey = <T extends { key: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => a.key.localeCompare(b.key));
};
