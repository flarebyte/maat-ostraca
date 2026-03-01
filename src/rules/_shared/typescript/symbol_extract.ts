import type { SgNode } from '@ast-grep/napi';
import { kind, Lang, parse } from '@ast-grep/napi';
import type { Language } from '../../../core/contracts/language.js';
import { InternalError } from '../../../core/errors/index.js';

export interface FunctionSymbol {
  name: string;
  modifiers: string[];
  params: string[];
  returns: string[];
}

export interface MethodSymbol {
  key: string;
  receiver: string;
  name: string;
  modifiers: string[];
  params: string[];
  returns: string[];
}

export interface ClassSymbol {
  name: string;
  modifiers: string[];
  extendsName?: string;
  implementsNames: string[];
  methodCount: number;
}

export interface InterfaceSymbol {
  name: string;
  modifiers: string[];
  extendsNames: string[];
  methods: string[];
  code: string;
}

const compareLex = (a: string, b: string): number => a.localeCompare(b);

const toAstLanguage = (language: Language): Lang => {
  if (language === 'typescript') {
    return Lang.TypeScript;
  }

  throw new InternalError(
    `symbol_extract_error: unsupported language "${language}"`,
  );
};

const lowerCamel = (value: string): string => {
  return value.length === 0
    ? value
    : value.charAt(0).toLowerCase() + value.slice(1);
};

const textOfFirstChild = (
  node: SgNode,
  kindName: string,
): string | undefined => {
  return node
    .children()
    .find((child) => child.kind() === kindName)
    ?.text();
};

const isFunctionExpressionKind = (kindName: string): boolean => {
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

const parseParams = (node: SgNode): string[] => {
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

const parseReturns = (node: SgNode): string[] => {
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

const parseAccessibilityModifier = (node: SgNode): string | undefined => {
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

const hasChildKind = (node: SgNode, kindName: string): boolean => {
  return node.children().some((child) => child.kind() === kindName);
};

const hasAncestorKind = (node: SgNode, kindName: string): boolean => {
  return node.ancestors().some((ancestor) => ancestor.kind() === kindName);
};

const hasExportModifier = (node: SgNode): boolean => {
  return hasAncestorKind(node, 'export_statement');
};

const hasDefaultModifier = (node: SgNode): boolean => {
  return node
    .ancestors()
    .some(
      (ancestor) =>
        ancestor.kind() === 'export_statement' &&
        hasChildKind(ancestor, 'default'),
    );
};

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
    });
  }

  return symbols;
};

const collectMethodSymbols = (root: SgNode): MethodSymbol[] => {
  const methods: MethodSymbol[] = [];
  const methodNodes = root.findAll(kind(Lang.TypeScript, 'method_definition'));

  for (const node of methodNodes) {
    const methodName = textOfFirstChild(node, 'property_identifier');
    if (!methodName) {
      continue;
    }

    const classNode = node
      .ancestors()
      .find(
        (ancestor) =>
          ancestor.kind() === 'class_declaration' ||
          ancestor.kind() === 'abstract_class_declaration',
      );
    if (!classNode) {
      continue;
    }

    const receiver =
      textOfFirstChild(classNode, 'type_identifier') ??
      textOfFirstChild(classNode, 'identifier');

    if (!receiver) {
      continue;
    }

    const modifiers = new Set<string>();
    const accessibility = parseAccessibilityModifier(node);
    if (accessibility) {
      modifiers.add(accessibility);
    }
    if (hasChildKind(node, 'static')) {
      modifiers.add('static');
    }
    if (hasChildKind(node, 'async')) {
      modifiers.add('async');
    }
    if (hasChildKind(node, 'override')) {
      modifiers.add('override');
    }

    methods.push({
      key: `${lowerCamel(receiver)}${methodName}`,
      receiver,
      name: methodName,
      modifiers: [...modifiers].sort(compareLex),
      params: parseParams(node),
      returns: parseReturns(node),
    });
  }

  return methods;
};

const collectClassSymbols = (root: SgNode): ClassSymbol[] => {
  const classes: ClassSymbol[] = [];
  const classNodes = [
    ...root.findAll(kind(Lang.TypeScript, 'class_declaration')),
    ...root.findAll(kind(Lang.TypeScript, 'abstract_class_declaration')),
  ];

  for (const node of classNodes) {
    const name =
      textOfFirstChild(node, 'type_identifier') ??
      textOfFirstChild(node, 'identifier');
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
    if (
      node.kind() === 'abstract_class_declaration' ||
      hasChildKind(node, 'abstract')
    ) {
      modifiers.add('abstract');
    }

    const heritage = node
      .children()
      .find((child) => child.kind() === 'class_heritage');

    const extendsName = heritage
      ?.children()
      .find((child) => child.kind() === 'extends_clause')
      ?.children()
      .find((child) => child.kind() !== 'extends')
      ?.text();

    const implementsNames =
      heritage
        ?.children()
        .find((child) => child.kind() === 'implements_clause')
        ?.children()
        .filter(
          (child) =>
            child.kind() === 'type_identifier' || child.kind() === 'identifier',
        )
        .map((child) => child.text()) ?? [];

    const classBody = node
      .children()
      .find((child) => child.kind() === 'class_body');

    const methodCount =
      classBody
        ?.children()
        .filter((child) => hasChildKind(child, 'property_identifier')).length ??
      0;

    classes.push({
      name,
      modifiers: [...modifiers].sort(compareLex),
      ...(extendsName ? { extendsName } : {}),
      implementsNames: [...implementsNames].sort(compareLex),
      methodCount,
    });
  }

  return classes;
};

const collectInterfaceSymbols = (root: SgNode): InterfaceSymbol[] => {
  const interfaces: InterfaceSymbol[] = [];
  const interfaceNodes = root.findAll(
    kind(Lang.TypeScript, 'interface_declaration'),
  );

  for (const node of interfaceNodes) {
    const name = textOfFirstChild(node, 'type_identifier');
    if (!name) {
      continue;
    }

    const modifiers = new Set<string>();
    if (hasExportModifier(node)) {
      modifiers.add('export');
    }

    const extendsNames =
      node
        .children()
        .find((child) => child.kind() === 'extends_type_clause')
        ?.children()
        .filter((child) => child.kind() === 'type_identifier')
        .map((child) => child.text()) ?? [];

    const methods =
      node
        .children()
        .find((child) => child.kind() === 'interface_body')
        ?.children()
        .filter((child) => child.kind() === 'method_signature')
        .map((child) => child.text().trim()) ?? [];

    interfaces.push({
      name,
      modifiers: [...modifiers].sort(compareLex),
      extendsNames: [...extendsNames].sort(compareLex),
      methods: [...methods].sort(compareLex),
      code: node.text(),
    });
  }

  return interfaces;
};

const sortByName = <T extends { name: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
};

const sortByKey = <T extends { key: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => a.key.localeCompare(b.key));
};

export interface ExtractedSymbols {
  functions: FunctionSymbol[];
  methods: MethodSymbol[];
  classes: ClassSymbol[];
  interfaces: InterfaceSymbol[];
}

export const extractTypeScriptSymbols = (
  source: string,
  language: Language,
): ExtractedSymbols => {
  try {
    const astLanguage = toAstLanguage(language);
    const root = parse(astLanguage, source).root();

    const functions = [
      ...collectFunctionDeclarationSymbols(root),
      ...collectVariableFunctionSymbols(root),
    ];

    return {
      functions: sortByName(functions),
      methods: sortByKey(collectMethodSymbols(root)),
      classes: sortByName(collectClassSymbols(root)),
      interfaces: sortByName(collectInterfaceSymbols(root)),
    };
  } catch (error: unknown) {
    if (error instanceof InternalError) {
      throw error;
    }

    throw new InternalError('symbol_extract_error: failed to extract symbols');
  }
};
