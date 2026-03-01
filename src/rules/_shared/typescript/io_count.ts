import type { SgNode } from '@ast-grep/napi';
import { kind, Lang, parse } from '@ast-grep/napi';
import { runAstGrepWithTimeout } from '../../../core/astgrep/timeout.js';
import type { Language } from '../../../core/contracts/language.js';
import { InternalError } from '../../../core/errors/index.js';
import { classifyIoCall, type IoCallKind } from './io_patterns.js';

export type IoCountMode = 'all' | 'read' | 'write';

export interface IoCountOutput {
  functions: Record<string, number>;
  methods: Record<string, number>;
}

interface SymbolBody {
  key: string;
  bodySource: string;
}

const FUNCTION_NAME_RE = /\bfunction\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/;
const DECLARATOR_NAME_RE = /^([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*/;
const FUNCTION_ASSIGNMENT_RE =
  /^[A-Za-z_$][A-Za-z0-9_$]*\s*=\s*(?:async\s*)?(?:function\b|(?:\([^)]*\)|[A-Za-z_$][A-Za-z0-9_$]*)\s*=>)/s;
const METHOD_NAME_RE =
  /^(?:public|private|protected|static|readonly|abstract|override|async|\s)*([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/;
const CLASS_NAME_RE = /\bclass\s+([A-Za-z_$][A-Za-z0-9_$]*)\b/;
const CALL_CALLEE_RE = /^([\s\S]*?)\(/;

const toAstLanguage = (language: Language): Lang => {
  if (language === 'typescript') {
    return Lang.TypeScript;
  }

  throw new InternalError(`io_count_error: unsupported language "${language}"`);
};

const lowerCamel = (value: string): string => {
  if (value.length === 0) {
    return value;
  }
  return value.charAt(0).toLowerCase() + value.slice(1);
};

const sortedObject = (
  input: Record<string, number>,
): Record<string, number> => {
  const output: Record<string, number> = {};
  for (const key of Object.keys(input).sort((a, b) => a.localeCompare(b))) {
    const value = input[key];
    if (value !== undefined) {
      output[key] = value;
    }
  }
  return output;
};

const isMethodComputed = (text: string): boolean => {
  return text.trimStart().startsWith('[');
};

const findFunctionSymbols = (root: SgNode): SymbolBody[] => {
  const symbols: SymbolBody[] = [];

  const functionNodes = root.findAll(
    kind(Lang.TypeScript, 'function_declaration'),
  );
  for (const node of functionNodes) {
    const text = node.text();
    const name = text.match(FUNCTION_NAME_RE)?.[1];
    if (!name) {
      continue;
    }
    symbols.push({ key: name, bodySource: text });
  }

  const declaratorNodes = root.findAll(
    kind(Lang.TypeScript, 'variable_declarator'),
  );
  for (const node of declaratorNodes) {
    const text = node.text().trim();
    if (!FUNCTION_ASSIGNMENT_RE.test(text)) {
      continue;
    }

    const name = text.match(DECLARATOR_NAME_RE)?.[1];
    if (!name) {
      continue;
    }

    symbols.push({ key: name, bodySource: text });
  }

  return symbols;
};

const findMethodSymbols = (root: SgNode): SymbolBody[] => {
  const symbols: SymbolBody[] = [];
  const methodNodes = root.findAll(kind(Lang.TypeScript, 'method_definition'));

  for (const node of methodNodes) {
    const methodText = node.text();
    if (isMethodComputed(methodText)) {
      continue;
    }

    const methodName = methodText.match(METHOD_NAME_RE)?.[1];
    if (!methodName) {
      continue;
    }

    const classNode = node
      .ancestors()
      .find((ancestor) => ancestor.kind() === 'class_declaration');
    if (!classNode) {
      continue;
    }

    const className = classNode.text().match(CLASS_NAME_RE)?.[1];
    if (!className) {
      continue;
    }

    symbols.push({
      key: `${lowerCamel(className)}${methodName}`,
      bodySource: methodText,
    });
  }

  return symbols;
};

const shouldCountKind = (detected: IoCallKind, mode: IoCountMode): boolean => {
  if (mode === 'all') {
    return true;
  }
  return detected === mode;
};

const countIoCallsInSnippet = async (
  source: string,
  mode: IoCountMode,
): Promise<number> => {
  return runAstGrepWithTimeout(async () => {
    const root = parse(Lang.TypeScript, source).root();
    const calls = root.findAll(kind(Lang.TypeScript, 'call_expression'));

    let count = 0;
    for (const call of calls) {
      const callText = call.text();
      const callee = callText.match(CALL_CALLEE_RE)?.[1]?.trim();
      if (!callee) {
        continue;
      }

      const detected = classifyIoCall(callee);
      if (!detected) {
        continue;
      }
      if (shouldCountKind(detected, mode)) {
        count += 1;
      }
    }

    return count;
  });
};

const countBySymbol = (
  symbols: SymbolBody[],
  mode: IoCountMode,
): Promise<Record<string, number>> => {
  const counts: Record<string, number> = {};

  return Promise.all(
    symbols.map(async (symbol) => {
      counts[symbol.key] = await countIoCallsInSnippet(symbol.bodySource, mode);
    }),
  ).then(() => sortedObject(counts));
};

export const countIoBySymbol = async (
  source: string,
  language: Language,
  mode: IoCountMode,
): Promise<IoCountOutput> => {
  try {
    const astLanguage = toAstLanguage(language);
    const root = await runAstGrepWithTimeout(async () =>
      parse(astLanguage, source).root(),
    );

    const functionSymbols = findFunctionSymbols(root);
    const methodSymbols = findMethodSymbols(root);

    return {
      functions: await countBySymbol(functionSymbols, mode),
      methods: await countBySymbol(methodSymbols, mode),
    };
  } catch (error: unknown) {
    if (error instanceof InternalError) {
      throw error;
    }

    throw new InternalError('io_count_error: failed to compute io counts');
  }
};
