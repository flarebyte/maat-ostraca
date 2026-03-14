import { InternalError } from '../../../core/errors/index.js';
import type { RuleRunInput } from '../../dispatch.js';
import { lowerCamel } from '../common.js';
import {
  forEachGoTopLevel,
  matchesGoKeyword,
  scanGoBalanced,
  scanGoIdentifier,
  skipGoWhitespaceAndComments,
  splitGoTopLevelSegments,
} from './lexing.js';

interface FunctionSymbol {
  name: string;
  modifiers: string[];
  params: string[];
  returns: string[];
  code: string;
  bodySource: string;
}

interface MethodSymbol {
  key: string;
  receiver: string;
  name: string;
  modifiers: string[];
  params: string[];
  returns: string[];
  code: string;
  bodySource: string;
}

interface GoSymbols {
  functions: FunctionSymbol[];
  methods: MethodSymbol[];
}

const compareLex = (left: string, right: string): number =>
  left.localeCompare(right);

const parseParams = (value: string): string[] => {
  return splitGoTopLevelSegments(value, [',']).map((entry) => entry.trim());
};

const parseReturns = (
  source: string,
  start: number,
): { returns: string[]; end: number } => {
  const index = skipGoWhitespaceAndComments(source, start);

  if (source[index] === '{' || index >= source.length) {
    return { returns: [], end: index };
  }

  if (source[index] === '(') {
    const balanced = scanGoBalanced(source, index, '(', ')');
    return {
      returns: splitGoTopLevelSegments(balanced.text, [',']).map((entry) =>
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

const extractGoSymbolsInternal = (source: string): GoSymbols => {
  const functions: FunctionSymbol[] = [];
  const methods: MethodSymbol[] = [];
  forEachGoTopLevel(source, (index) => {
    if (!matchesGoKeyword(source, index, 'func')) {
      return undefined;
    }

    let cursor = skipGoWhitespaceAndComments(source, index + 4);
    let receiverText: string | undefined;

    if (source[cursor] === '(') {
      const receiver = scanGoBalanced(source, cursor, '(', ')');
      receiverText = receiver.text.trim();
      cursor = skipGoWhitespaceAndComments(source, receiver.end);
    }

    const nameToken = scanGoIdentifier(source, cursor);
    if (!nameToken) {
      return index + 4;
    }

    cursor = skipGoWhitespaceAndComments(source, nameToken.end);
    if (source[cursor] !== '(') {
      return cursor;
    }

    const params = scanGoBalanced(source, cursor, '(', ')');
    cursor = params.end;
    const returns = parseReturns(source, cursor);
    const bodyStart = skipGoWhitespaceAndComments(source, returns.end);
    const body =
      source[bodyStart] === '{'
        ? scanGoBalanced(source, bodyStart, '{', '}')
        : undefined;
    const code = source.slice(index, body?.end ?? returns.end);
    const bodySource =
      body === undefined ? source.slice(index, returns.end) : body.text;

    if (receiverText === undefined) {
      functions.push({
        name: nameToken.text,
        modifiers: [],
        params: parseParams(params.text),
        returns: returns.returns,
        code,
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
        code,
        bodySource,
      });
    }

    return body?.end ?? returns.end;
  });

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
