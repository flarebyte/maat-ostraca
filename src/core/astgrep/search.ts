import type { Language } from '../contracts/language.js';
import { InternalError } from '../errors/index.js';

export interface AstGrepSearchInput {
  source: string;
  language: Language;
  pattern: string;
}

export interface AstGrepKindSearchInput {
  source: string;
  language: Language;
  kindName: string;
}

export interface AstGrepMatch {
  text: string;
}

const toAstGrepLanguage = async (language: Language): Promise<unknown> => {
  const { Lang } = await import('@ast-grep/napi');

  if (language === 'typescript') {
    return Lang.TypeScript;
  }

  throw new InternalError(`astgrep_error: unsupported language "${language}"`);
};

export const search = async (
  input: AstGrepSearchInput,
): Promise<AstGrepMatch[]> => {
  try {
    const astLanguage = await toAstGrepLanguage(input.language);
    const { parse, pattern } = await import('@ast-grep/napi');

    const root = parse(astLanguage as never, input.source).root();
    const compiledPattern = pattern(astLanguage as never, input.pattern);
    const nodes = root.findAll(compiledPattern);

    return nodes.map((node) => ({ text: node.text() }));
  } catch (error: unknown) {
    if (error instanceof InternalError) {
      throw error;
    }

    throw new InternalError('astgrep_error: failed to run search');
  }
};

export const searchByKind = async (
  input: AstGrepKindSearchInput,
): Promise<AstGrepMatch[]> => {
  try {
    const astLanguage = await toAstGrepLanguage(input.language);
    const { kind, parse } = await import('@ast-grep/napi');

    const root = parse(astLanguage as never, input.source).root();
    const astKind = kind(astLanguage as never, input.kindName as never);
    const nodes = root.findAll(astKind);

    return nodes.map((node) => ({ text: node.text() }));
  } catch (error: unknown) {
    if (error instanceof InternalError) {
      throw error;
    }

    throw new InternalError('astgrep_error: failed to run kind search');
  }
};
