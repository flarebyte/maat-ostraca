import { parse } from '@ast-grep/napi';
import type { Language } from '../../../core/contracts/language.js';
import { InternalError } from '../../../core/errors/index.js';
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

export const extractTypeScriptSymbols = (
  source: string,
  language: Language,
): ExtractedSymbols => {
  try {
    const astLanguage = toAstLanguage(language);
    const root = parse(astLanguage, source).root();

    return {
      functions: sortByName(collectFunctionSymbols(root)),
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
