import type { SgNode } from '@ast-grep/napi';
import { kind, Lang, parse } from '@ast-grep/napi';
import { runAstGrepWithTimeout } from '../../../core/astgrep/timeout.js';
import type { Language } from '../../../core/contracts/language.js';
import { InternalError } from '../../../core/errors/index.js';
import { readLiteralString } from './string_literals.js';

const sortedDedup = (values: string[]): string[] => {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
};

const firstArgumentNode = (argumentsNode: SgNode): SgNode | undefined => {
  return argumentsNode
    .children()
    .find((child) => !['(', ')', ','].includes(String(child.kind())));
};

const firstLiteralArgumentFromCallLike = (node: SgNode): string | undefined => {
  const args = node
    .children()
    .find((child) => String(child.kind()) === 'arguments');
  if (!args) {
    return undefined;
  }

  const firstArg = firstArgumentNode(args);
  if (!firstArg) {
    return undefined;
  }

  return readLiteralString(firstArg);
};

const toAstLanguage = (language: Language): Lang => {
  if (language === 'typescript') {
    return Lang.TypeScript;
  }

  throw new InternalError(
    `message_extract_error: unsupported language "${language}"`,
  );
};

export const extractExceptionMessages = async (
  source: string,
  language: Language,
): Promise<string[]> => {
  try {
    return runAstGrepWithTimeout(async () => {
      const root = parse(toAstLanguage(language), source).root();
      const throwNodes = root.findAll(kind(Lang.TypeScript, 'throw_statement'));
      const messages: string[] = [];

      for (const throwNode of throwNodes) {
        const thrown = throwNode
          .children()
          .find((child) => String(child.kind()) !== 'throw');

        if (!thrown) {
          continue;
        }

        const thrownKind = String(thrown.kind());
        if (thrownKind === 'string' || thrownKind === 'template_string') {
          const message = readLiteralString(thrown);
          if (message !== undefined) {
            messages.push(message);
          }
          continue;
        }

        if (thrownKind === 'new_expression') {
          const ctor = thrown
            .children()
            .find((child) => String(child.kind()) === 'identifier');
          if (!ctor) {
            continue;
          }

          const message = firstLiteralArgumentFromCallLike(thrown);
          if (message !== undefined) {
            messages.push(message);
          }
          continue;
        }

        if (thrownKind === 'call_expression') {
          const callee = thrown
            .children()
            .find((child) => String(child.kind()) === 'identifier');
          if (!callee) {
            continue;
          }

          const message = firstLiteralArgumentFromCallLike(thrown);
          if (message !== undefined) {
            messages.push(message);
          }
        }
      }

      return sortedDedup(messages);
    });
  } catch (error: unknown) {
    if (error instanceof InternalError) {
      throw error;
    }

    throw new InternalError(
      'message_extract_error: failed to extract exception messages',
    );
  }
};

const isErrorReporterCallee = (calleeText: string): boolean => {
  return (
    calleeText === 'console.error' ||
    calleeText === 'logger.error' ||
    calleeText.endsWith('.logger.error')
  );
};

export const extractErrorMessages = async (
  source: string,
  language: Language,
): Promise<string[]> => {
  try {
    return runAstGrepWithTimeout(async () => {
      const root = parse(toAstLanguage(language), source).root();
      const callNodes = root.findAll(kind(Lang.TypeScript, 'call_expression'));
      const messages: string[] = [];

      for (const call of callNodes) {
        const calleeNode = call
          .children()
          .find((child) => String(child.kind()) !== 'arguments');
        if (!calleeNode) {
          continue;
        }

        const calleeText = calleeNode.text().trim();
        if (!isErrorReporterCallee(calleeText)) {
          continue;
        }

        const message = firstLiteralArgumentFromCallLike(call);
        if (message !== undefined) {
          messages.push(message);
        }
      }

      return sortedDedup(messages);
    });
  } catch (error: unknown) {
    if (error instanceof InternalError) {
      throw error;
    }

    throw new InternalError(
      'message_extract_error: failed to extract error messages',
    );
  }
};
