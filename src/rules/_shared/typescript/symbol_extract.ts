import { parse } from '@ast-grep/napi';
import { runAstGrepWithTimeout } from '../../../core/astgrep/timeout.js';
import type { Language } from '../../../core/contracts/language.js';
import { InternalError, UsageError } from '../../../core/errors/index.js';
import { collectClassSymbols } from './symbol_extract/class_symbols.js';
import {
  sortByKey,
  sortByName,
  toAstLanguage,
} from './symbol_extract/common.js';
import { collectFunctionSymbols } from './symbol_extract/function_symbols.js';
import { collectInterfaceSymbols } from './symbol_extract/interface_symbols.js';
import { collectMethodSymbols } from './symbol_extract/method_symbols.js';
import type { ExtractedSymbols } from './symbol_extract/types.js';

export type {
  ClassSymbol,
  ExtractedSymbols,
  FunctionSymbol,
  InterfaceSymbol,
  MethodSymbol,
} from './symbol_extract/types.js';

export const MAX_SYMBOLS_PER_FILE = 5_000;

export interface ExtractTypeScriptSymbolsOptions {
  maxSymbols?: number;
}

const countRegexMatches = (source: string, expression: RegExp): number => {
  return source.match(expression)?.length ?? 0;
};

const estimateSymbolCount = (source: string): number => {
  const functionDeclarations = countRegexMatches(
    source,
    /\bfunction\s+[A-Za-z_$][A-Za-z0-9_$]*\s*\(/g,
  );
  const variableFunctionDeclarations = countRegexMatches(
    source,
    /\b(?:const|let|var)\s+[A-Za-z_$][A-Za-z0-9_$]*\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][A-Za-z0-9_$]*\s*=>)/g,
  );
  const classes = countRegexMatches(
    source,
    /\b(?:abstract\s+)?class\s+[A-Za-z_$][A-Za-z0-9_$]*/g,
  );
  const interfaces = countRegexMatches(
    source,
    /\binterface\s+[A-Za-z_$][A-Za-z0-9_$]*/g,
  );

  return (
    functionDeclarations + variableFunctionDeclarations + classes + interfaces
  );
};

const ensureSymbolCountWithinLimit = (
  count: number,
  maxSymbols: number,
): void => {
  if (count > maxSymbols) {
    throw new UsageError(
      `symbol_limit_exceeded: extracted ${count} symbols, limit is ${maxSymbols}`,
      {
        code: 'E_SYMBOL_LIMIT_EXCEEDED',
      },
    );
  }
};

export const extractTypeScriptSymbols = async (
  source: string,
  language: Language,
  options: ExtractTypeScriptSymbolsOptions = {},
): Promise<ExtractedSymbols> => {
  try {
    const maxSymbols = options.maxSymbols ?? MAX_SYMBOLS_PER_FILE;
    ensureSymbolCountWithinLimit(estimateSymbolCount(source), maxSymbols);
    const astLanguage = toAstLanguage(language);
    const root = await runAstGrepWithTimeout(async () =>
      parse(astLanguage, source).root(),
    );
    const functions = sortByName(collectFunctionSymbols(root));
    const methods = sortByKey(collectMethodSymbols(root));
    const classes = sortByName(collectClassSymbols(root));
    const interfaces = sortByName(collectInterfaceSymbols(root));
    ensureSymbolCountWithinLimit(
      functions.length + methods.length + classes.length + interfaces.length,
      maxSymbols,
    );

    return {
      functions,
      methods,
      classes,
      interfaces,
    };
  } catch (error: unknown) {
    if (error instanceof UsageError || error instanceof InternalError) {
      throw error;
    }

    throw new InternalError('symbol_extract_error: failed to extract symbols');
  }
};
