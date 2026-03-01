import type { Language } from '../contracts/language.js';
import { InternalError } from '../errors/index.js';
import {
  type AstGrepTimeoutOptions,
  runAstGrepWithTimeout,
} from './timeout.js';

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

interface SearchDeps extends AstGrepTimeoutOptions {
  loadAstGrep?: () => Promise<typeof import('@ast-grep/napi')>;
}

const defaultLoadAstGrep = async (): Promise<typeof import('@ast-grep/napi')> =>
  import('@ast-grep/napi');

const toAstGrepLanguage = (
  language: Language,
  astGrep: typeof import('@ast-grep/napi'),
): unknown => {
  const { Lang } = astGrep;

  if (language === 'typescript') {
    return Lang.TypeScript;
  }

  throw new InternalError(`astgrep_error: unsupported language "${language}"`);
};

export const search = async (
  input: AstGrepSearchInput,
  deps: SearchDeps = {},
): Promise<AstGrepMatch[]> => {
  try {
    const loadAstGrep = deps.loadAstGrep ?? defaultLoadAstGrep;
    return runAstGrepWithTimeout(
      async () => {
        const astGrep = await loadAstGrep();
        const astLanguage = toAstGrepLanguage(input.language, astGrep);
        const { parse, pattern } = astGrep;

        const root = parse(astLanguage as never, input.source).root();
        const compiledPattern = pattern(astLanguage as never, input.pattern);
        const nodes = root.findAll(compiledPattern);

        return nodes.map((node) => ({ text: node.text() }));
      },
      ...(deps.timeoutMs !== undefined ? [{ timeoutMs: deps.timeoutMs }] : []),
    );
  } catch (error: unknown) {
    if (error instanceof InternalError) {
      throw error;
    }

    throw new InternalError('astgrep_error: failed to run search');
  }
};

export const searchByKind = async (
  input: AstGrepKindSearchInput,
  deps: SearchDeps = {},
): Promise<AstGrepMatch[]> => {
  try {
    const loadAstGrep = deps.loadAstGrep ?? defaultLoadAstGrep;
    return runAstGrepWithTimeout(
      async () => {
        const astGrep = await loadAstGrep();
        const astLanguage = toAstGrepLanguage(input.language, astGrep);
        const { kind, parse } = astGrep;

        const root = parse(astLanguage as never, input.source).root();
        const astKind = kind(astLanguage as never, input.kindName as never);
        const nodes = root.findAll(astKind);

        return nodes.map((node) => ({ text: node.text() }));
      },
      ...(deps.timeoutMs !== undefined ? [{ timeoutMs: deps.timeoutMs }] : []),
    );
  } catch (error: unknown) {
    if (error instanceof InternalError) {
      throw error;
    }

    throw new InternalError('astgrep_error: failed to run kind search');
  }
};
