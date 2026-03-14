import { InternalError } from '../../../core/errors/index.js';
import type { RuleRunInput } from '../../dispatch.js';

interface FunctionSymbol {
  name: string;
  modifiers: string[];
  params: string[];
  returns: string[];
  bodySource: string;
}

interface MethodSymbol {
  key: string;
  receiver: string;
  name: string;
  modifiers: string[];
  params: string[];
  returns: string[];
  bodySource: string;
}

interface GoSymbols {
  functions: FunctionSymbol[];
  methods: MethodSymbol[];
}

const compareLex = (left: string, right: string): number =>
  left.localeCompare(right);

const isIdentifierStart = (char: string | undefined): boolean => {
  return char !== undefined && /[A-Za-z_]/.test(char);
};

const isIdentifierPart = (char: string | undefined): boolean => {
  return char !== undefined && /[A-Za-z0-9_]/.test(char);
};

const skipWhitespaceAndComments = (source: string, start: number): number => {
  let index = start;

  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];

    if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
      index += 1;
      continue;
    }

    if (char === '/' && next === '/') {
      index += 2;
      while (index < source.length && source[index] !== '\n') {
        index += 1;
      }
      continue;
    }

    if (char === '/' && next === '*') {
      index += 2;
      while (index < source.length) {
        if (source[index] === '*' && source[index + 1] === '/') {
          index += 2;
          break;
        }
        index += 1;
      }
      continue;
    }

    break;
  }

  return index;
};

const scanIdentifier = (
  source: string,
  start: number,
): { text: string; end: number } | undefined => {
  if (!isIdentifierStart(source[start])) {
    return undefined;
  }

  let end = start + 1;
  while (isIdentifierPart(source[end])) {
    end += 1;
  }

  return {
    text: source.slice(start, end),
    end,
  };
};

const scanBalanced = (
  source: string,
  start: number,
  open: string,
  close: string,
): { text: string; end: number } => {
  if (source[start] !== open) {
    throw new Error(`expected ${open}`);
  }

  let depth = 0;
  let index = start;

  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];

    if (char === '/' && next === '/') {
      index += 2;
      while (index < source.length && source[index] !== '\n') {
        index += 1;
      }
      continue;
    }

    if (char === '/' && next === '*') {
      index += 2;
      while (index < source.length) {
        if (source[index] === '*' && source[index + 1] === '/') {
          index += 2;
          break;
        }
        index += 1;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      const quote = char;
      index += 1;
      let escaped = false;
      while (index < source.length) {
        const current = source[index];
        index += 1;
        if (escaped) {
          escaped = false;
          continue;
        }
        if (current === '\\') {
          escaped = true;
          continue;
        }
        if (current === quote) {
          break;
        }
      }
      continue;
    }

    if (char === '`') {
      index += 1;
      while (index < source.length) {
        const current = source[index];
        index += 1;
        if (current === '`') {
          break;
        }
      }
      continue;
    }

    if (char === open) {
      depth += 1;
    } else if (char === close) {
      depth -= 1;
      if (depth === 0) {
        return {
          text: source.slice(start + 1, index),
          end: index + 1,
        };
      }
    }

    index += 1;
  }

  throw new Error(`unbalanced ${open}${close}`);
};

const splitTopLevelCommaList = (value: string): string[] => {
  const entries: string[] = [];
  let start = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '(') {
      parenDepth += 1;
      continue;
    }
    if (char === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
      continue;
    }
    if (char === '[') {
      bracketDepth += 1;
      continue;
    }
    if (char === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }
    if (char === '{') {
      braceDepth += 1;
      continue;
    }
    if (char === '}') {
      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }

    if (
      char === ',' &&
      parenDepth === 0 &&
      bracketDepth === 0 &&
      braceDepth === 0
    ) {
      const entry = value.slice(start, index).trim();
      if (entry.length > 0) {
        entries.push(entry);
      }
      start = index + 1;
    }
  }

  const trailing = value.slice(start).trim();
  if (trailing.length > 0) {
    entries.push(trailing);
  }

  return entries;
};

const parseParams = (value: string): string[] => {
  return splitTopLevelCommaList(value).map((entry) => entry.trim());
};

const parseReturns = (
  source: string,
  start: number,
): { returns: string[]; end: number } => {
  const index = skipWhitespaceAndComments(source, start);

  if (source[index] === '{' || index >= source.length) {
    return { returns: [], end: index };
  }

  if (source[index] === '(') {
    const balanced = scanBalanced(source, index, '(', ')');
    return {
      returns: splitTopLevelCommaList(balanced.text).map((entry) =>
        entry.trim(),
      ),
      end: balanced.end,
    };
  }

  let end = index;
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;

  while (end < source.length) {
    const char = source[end];
    if (char === '(') {
      parenDepth += 1;
    } else if (char === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
    } else if (char === '[') {
      bracketDepth += 1;
    } else if (char === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1);
    } else if (
      char === '{' &&
      parenDepth === 0 &&
      bracketDepth === 0 &&
      braceDepth === 0
    ) {
      break;
    } else if (char === '{') {
      braceDepth += 1;
    } else if (char === '}') {
      braceDepth = Math.max(0, braceDepth - 1);
    }
    end += 1;
  }

  const text = source.slice(index, end).trim();
  return {
    returns: text.length === 0 ? [] : [text],
    end,
  };
};

const normalizeReceiverType = (receiverText: string): string => {
  const fields = receiverText.trim().split(/\s+/).filter(Boolean);
  const rawType = fields.at(-1) ?? '';
  const withoutPointer = rawType.replace(/^\*+/, '');
  const withoutGenerics = withoutPointer.replace(/\[.*\]$/, '');
  const parts = withoutGenerics.split('.');
  return parts.at(-1) ?? withoutGenerics;
};

const lowerCamel = (value: string): string => {
  if (value.length === 0) {
    return value;
  }

  return value.slice(0, 1).toLowerCase() + value.slice(1);
};

const extractGoSymbolsInternal = (source: string): GoSymbols => {
  const functions: FunctionSymbol[] = [];
  const methods: MethodSymbol[] = [];
  let index = 0;
  let braceDepth = 0;

  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];

    if (char === '/' && next === '/') {
      index += 2;
      while (index < source.length && source[index] !== '\n') {
        index += 1;
      }
      continue;
    }

    if (char === '/' && next === '*') {
      index += 2;
      while (index < source.length) {
        if (source[index] === '*' && source[index + 1] === '/') {
          index += 2;
          break;
        }
        index += 1;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      const quote = char;
      index += 1;
      let escaped = false;
      while (index < source.length) {
        const current = source[index];
        index += 1;
        if (escaped) {
          escaped = false;
          continue;
        }
        if (current === '\\') {
          escaped = true;
          continue;
        }
        if (current === quote) {
          break;
        }
      }
      continue;
    }

    if (char === '`') {
      index += 1;
      while (index < source.length) {
        const current = source[index];
        index += 1;
        if (current === '`') {
          break;
        }
      }
      continue;
    }

    if (char === '{') {
      braceDepth += 1;
      index += 1;
      continue;
    }

    if (char === '}') {
      braceDepth = Math.max(0, braceDepth - 1);
      index += 1;
      continue;
    }

    if (
      braceDepth === 0 &&
      source.startsWith('func', index) &&
      !isIdentifierPart(source[index - 1]) &&
      !isIdentifierPart(source[index + 4])
    ) {
      let cursor = skipWhitespaceAndComments(source, index + 4);
      let receiverText: string | undefined;

      if (source[cursor] === '(') {
        const receiver = scanBalanced(source, cursor, '(', ')');
        receiverText = receiver.text.trim();
        cursor = skipWhitespaceAndComments(source, receiver.end);
      }

      const nameToken = scanIdentifier(source, cursor);
      if (!nameToken) {
        index += 4;
        continue;
      }

      cursor = skipWhitespaceAndComments(source, nameToken.end);
      if (source[cursor] !== '(') {
        index = cursor;
        continue;
      }

      const params = scanBalanced(source, cursor, '(', ')');
      cursor = params.end;
      const returns = parseReturns(source, cursor);
      const body =
        source[returns.end] === '{'
          ? scanBalanced(source, returns.end, '{', '}')
          : undefined;
      const bodySource =
        body === undefined ? source.slice(index, returns.end) : body.text;

      if (receiverText === undefined) {
        functions.push({
          name: nameToken.text,
          modifiers: [],
          params: parseParams(params.text),
          returns: returns.returns,
          bodySource,
        });
      } else {
        const receiver = normalizeReceiverType(receiverText);
        methods.push({
          key: `${lowerCamel(receiver)}${nameToken.text}`,
          receiver,
          name: nameToken.text,
          modifiers: [],
          params: parseParams(params.text),
          returns: returns.returns,
          bodySource,
        });
      }

      index = body?.end ?? returns.end;
      continue;
    }

    index += 1;
  }

  return {
    functions: functions.sort((left, right) =>
      compareLex(left.name, right.name),
    ),
    methods: methods.sort((left, right) => compareLex(left.key, right.key)),
  };
};

export const extractGoSymbols = (input: RuleRunInput): GoSymbols => {
  if (input.language !== 'go') {
    throw new InternalError(
      `symbol_extract_error: unsupported language "${input.language}"`,
    );
  }

  try {
    return extractGoSymbolsInternal(input.source);
  } catch {
    throw new InternalError('symbol_extract_error: failed to extract symbols');
  }
};
