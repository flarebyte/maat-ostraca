import { InternalError } from '../../../core/errors/index.js';
import type { RuleRunInput } from '../../dispatch.js';

interface DartFunctionSymbol {
  name: string;
  modifiers: string[];
  params: string[];
  returns: string[];
  bodySource: string;
}

interface DartMethodSymbol {
  key: string;
  receiver: string;
  name: string;
  modifiers: string[];
  params: string[];
  returns: string[];
  bodySource: string;
}

interface DartClassSymbol {
  name: string;
  modifiers: string[];
  extendsName?: string;
  implementsNames: string[];
  methodCount: number;
}

interface DartSymbols {
  functions: DartFunctionSymbol[];
  methods: DartMethodSymbol[];
  classes: DartClassSymbol[];
}

const compareLex = (left: string, right: string): number =>
  left.localeCompare(right);

const isIdentifierPart = (char: string | undefined): boolean => {
  return char !== undefined && /[A-Za-z0-9_$]/.test(char);
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

const skipStringLiteral = (source: string, start: number): number => {
  const prefix = source[start];
  let quoteIndex = start;

  if (
    (prefix === 'r' || prefix === 'R') &&
    (source[start + 1] === "'" || source[start + 1] === '"')
  ) {
    quoteIndex += 1;
  }

  const quote = source[quoteIndex];
  const triple =
    source[quoteIndex + 1] === quote &&
    source[quoteIndex + 2] === quote &&
    quote !== undefined;
  let index = quoteIndex;

  if (triple) {
    index += 3;
    while (index < source.length) {
      if (
        source[index] === quote &&
        source[index + 1] === quote &&
        source[index + 2] === quote
      ) {
        return index + 3;
      }
      index += 1;
    }
    return index;
  }

  index += 1;
  let escaped = false;
  while (index < source.length) {
    const char = source[index];
    index += 1;

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\' && prefix !== 'r' && prefix !== 'R') {
      escaped = true;
      continue;
    }

    if (char === quote) {
      break;
    }
  }

  return index;
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

    if (
      char === "'" ||
      char === '"' ||
      ((char === 'r' || char === 'R') && (next === "'" || next === '"'))
    ) {
      index = skipStringLiteral(source, index);
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

const splitTopLevelCommaList = (
  value: string,
  options: { unwrapOptionalGroups?: boolean } = {},
): string[] => {
  const entries: string[] = [];
  let start = 0;
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let angleDepth = 0;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const next = value[index + 1];

    if (
      char === "'" ||
      char === '"' ||
      ((char === 'r' || char === 'R') && (next === "'" || next === '"'))
    ) {
      index = skipStringLiteral(value, index) - 1;
      continue;
    }

    if (char === '(') {
      parenDepth += 1;
      continue;
    }
    if (char === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
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
    if (char === '[') {
      bracketDepth += 1;
      continue;
    }
    if (char === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }
    if (char === '<') {
      angleDepth += 1;
      continue;
    }
    if (char === '>') {
      angleDepth = Math.max(0, angleDepth - 1);
      continue;
    }

    const braceOkay = !options.unwrapOptionalGroups
      ? braceDepth === 0
      : braceDepth <= 1;
    const bracketOkay = !options.unwrapOptionalGroups
      ? bracketDepth === 0
      : bracketDepth <= 1;

    if (
      char === ',' &&
      parenDepth === 0 &&
      angleDepth === 0 &&
      braceOkay &&
      bracketOkay
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

  return entries.map((entry) => {
    let normalized = entry.trim();
    if (normalized.startsWith('{') || normalized.startsWith('[')) {
      normalized = normalized.slice(1).trim();
    }
    if (normalized.endsWith('}') || normalized.endsWith(']')) {
      normalized = normalized.slice(0, -1).trim();
    }
    return normalized;
  });
};

const parseParams = (value: string): string[] => {
  return splitTopLevelCommaList(value, {
    unwrapOptionalGroups: true,
  }).filter((entry) => entry.length > 0);
};

const sortModifiers = (
  value: ReadonlyArray<string>,
  allowed: ReadonlyArray<string>,
): string[] => {
  return [...new Set(value.filter((item) => allowed.includes(item)))].sort(
    compareLex,
  );
};

const lowerCamel = (value: string): string => {
  if (value.length === 0) {
    return value;
  }

  return value.slice(0, 1).toLowerCase() + value.slice(1);
};

const upperCamelSegment = (value: string): string => {
  if (value.length === 0) {
    return value;
  }

  return value.slice(0, 1).toUpperCase() + value.slice(1);
};

const readDeclarationSegment = (
  source: string,
  start: number,
): { text: string; end: number } => {
  let index = start;
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let angleDepth = 0;

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

    if (
      char === "'" ||
      char === '"' ||
      ((char === 'r' || char === 'R') && (next === "'" || next === '"'))
    ) {
      index = skipStringLiteral(source, index);
      continue;
    }

    if (char === '(') {
      parenDepth += 1;
      index += 1;
      continue;
    }
    if (char === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
      index += 1;
      continue;
    }
    if (char === '{') {
      if (
        parenDepth === 0 &&
        braceDepth === 0 &&
        bracketDepth === 0 &&
        angleDepth === 0
      ) {
        const block = scanBalanced(source, index, '{', '}');
        return {
          text: source.slice(start, block.end).trim(),
          end: block.end,
        };
      }

      braceDepth += 1;
      index += 1;
      continue;
    }
    if (char === '}') {
      braceDepth = Math.max(0, braceDepth - 1);
      index += 1;
      continue;
    }
    if (char === '[') {
      bracketDepth += 1;
      index += 1;
      continue;
    }
    if (char === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1);
      index += 1;
      continue;
    }
    if (char === '<') {
      angleDepth += 1;
      index += 1;
      continue;
    }
    if (char === '>') {
      angleDepth = Math.max(0, angleDepth - 1);
      index += 1;
      continue;
    }

    if (
      char === '=' &&
      next === '>' &&
      parenDepth === 0 &&
      braceDepth === 0 &&
      bracketDepth === 0 &&
      angleDepth === 0
    ) {
      index += 2;
      while (index < source.length) {
        const current = source[index];
        const following = source[index + 1];
        if (current === ';') {
          return {
            text: source.slice(start, index + 1).trim(),
            end: index + 1,
          };
        }
        if (
          current === "'" ||
          current === '"' ||
          ((current === 'r' || current === 'R') &&
            (following === "'" || following === '"'))
        ) {
          index = skipStringLiteral(source, index);
          continue;
        }
        index += 1;
      }
    }

    if (
      char === ';' &&
      parenDepth === 0 &&
      braceDepth === 0 &&
      bracketDepth === 0 &&
      angleDepth === 0
    ) {
      return {
        text: source.slice(start, index + 1).trim(),
        end: index + 1,
      };
    }

    index += 1;
  }

  return {
    text: source.slice(start).trim(),
    end: source.length,
  };
};

const collectDeclarationSegments = (source: string): string[] => {
  const segments: string[] = [];
  let index = 0;

  while (index < source.length) {
    index = skipWhitespaceAndComments(source, index);
    if (index >= source.length) {
      break;
    }

    const segment = readDeclarationSegment(source, index);
    if (segment.text.length > 0) {
      segments.push(segment.text);
    }
    index = segment.end;
  }

  return segments;
};

const findParameterStart = (segment: string): number | undefined => {
  let index = 0;
  let angleDepth = 0;

  while (index < segment.length) {
    const char = segment[index];
    const next = segment[index + 1];

    if (
      char === "'" ||
      char === '"' ||
      ((char === 'r' || char === 'R') && (next === "'" || next === '"'))
    ) {
      index = skipStringLiteral(segment, index);
      continue;
    }

    if (char === '<') {
      angleDepth += 1;
      index += 1;
      continue;
    }
    if (char === '>') {
      angleDepth = Math.max(0, angleDepth - 1);
      index += 1;
      continue;
    }

    if (char === '(' && angleDepth === 0) {
      return index;
    }

    index += 1;
  }

  return undefined;
};

const parseFunctionLike = (
  segment: string,
  options: {
    receiver?: string;
    allowedModifiers: readonly string[];
  },
): DartFunctionSymbol | DartMethodSymbol | undefined => {
  const paramsStart = findParameterStart(segment);
  if (paramsStart === undefined) {
    return undefined;
  }

  const params = scanBalanced(segment, paramsStart, '(', ')');
  const beforeParams = segment.slice(0, paramsStart).trimEnd();
  let afterParams = segment.slice(params.end).trim();
  if (beforeParams.includes('=')) {
    return undefined;
  }

  let nameEnd = beforeParams.length;
  while (
    nameEnd > 0 &&
    (beforeParams[nameEnd - 1] === ' ' || beforeParams[nameEnd - 1] === '\t')
  ) {
    nameEnd -= 1;
  }

  let nameStart = nameEnd;
  while (nameStart > 0 && isIdentifierPart(beforeParams[nameStart - 1])) {
    nameStart -= 1;
  }

  if (nameStart === nameEnd) {
    return undefined;
  }

  const name = beforeParams.slice(nameStart, nameEnd);
  const prefix = beforeParams.slice(0, nameStart).trim();
  if (prefix.endsWith('.')) {
    return undefined;
  }
  if (prefix.startsWith('factory ') || prefix.startsWith('operator ')) {
    return undefined;
  }
  if (
    prefix === 'set' ||
    prefix.endsWith(' set') ||
    prefix === 'get' ||
    prefix.endsWith(' get')
  ) {
    return undefined;
  }
  if (options.receiver !== undefined && name === options.receiver) {
    return undefined;
  }

  const prefixTokens = prefix.split(/\s+/).filter(Boolean);
  const prefixModifiers = prefixTokens.filter((token) =>
    options.allowedModifiers.includes(token),
  );
  const returnType = prefixTokens
    .filter((token) => !options.allowedModifiers.includes(token))
    .join(' ')
    .trim();

  const suffixModifiers: string[] = [];
  if (afterParams.startsWith('async*')) {
    suffixModifiers.push('async');
    afterParams = afterParams.slice('async*'.length).trim();
  } else if (afterParams.startsWith('async')) {
    const following = afterParams['async'.length];
    if (following === undefined || /\s|[;{=]/.test(following)) {
      suffixModifiers.push('async');
      afterParams = afterParams.slice('async'.length).trim();
    }
  }

  const modifiers = sortModifiers(
    [...prefixModifiers, ...suffixModifiers],
    options.allowedModifiers,
  );
  const parsedParams = parseParams(params.text).map((entry) => entry.trim());
  const returns = returnType.length > 0 ? [returnType] : [];

  if (options.receiver === undefined) {
    return {
      name,
      modifiers,
      params: parsedParams,
      returns,
      bodySource: segment,
    };
  }

  return {
    key: `${lowerCamel(options.receiver)}${upperCamelSegment(name)}`,
    receiver: options.receiver,
    name,
    modifiers,
    params: parsedParams,
    returns,
    bodySource: segment,
  };
};

const parseClass = (segment: string): DartClassSymbol | undefined => {
  const bodyStart = segment.indexOf('{');
  if (bodyStart === -1) {
    return undefined;
  }

  const header = segment.slice(0, bodyStart).trim();
  const match = header.match(
    /^(abstract\s+)?class\s+([A-Za-z_$][A-Za-z0-9_$]*)\b([\s\S]*)$/,
  );
  if (!match) {
    return undefined;
  }
  const name = match[2];
  const headerTail = match[3]?.trim() ?? '';
  if (name === undefined) {
    return undefined;
  }

  const body = scanBalanced(segment, bodyStart, '{', '}').text;
  const methods = collectDeclarationSegments(body)
    .map((member) =>
      parseFunctionLike(member, {
        receiver: name,
        allowedModifiers: ['async', 'external', 'static'],
      }),
    )
    .filter((symbol): symbol is DartMethodSymbol => symbol !== undefined)
    .sort((left, right) => compareLex(left.key, right.key));

  const extendsMatch = headerTail.match(
    /\bextends\s+(.+?)(?=\s+(?:implements|with)\b|$)/,
  );
  const implementsMatch = headerTail.match(/\bimplements\s+(.+?)$/);

  return {
    name,
    modifiers: sortModifiers(match[1] !== undefined ? ['abstract'] : [], [
      'abstract',
    ]),
    ...(extendsMatch?.[1]?.trim()
      ? { extendsName: extendsMatch[1].trim() }
      : {}),
    implementsNames: implementsMatch?.[1]
      ? splitTopLevelCommaList(implementsMatch[1]).map((entry) => entry.trim())
      : [],
    methodCount: methods.length,
  };
};

const extractDartSymbolsInternal = (source: string): DartSymbols => {
  const functions: DartFunctionSymbol[] = [];
  const methods: DartMethodSymbol[] = [];
  const classes: DartClassSymbol[] = [];

  for (const segment of collectDeclarationSegments(source)) {
    if (segment.startsWith('class ') || segment.startsWith('abstract class ')) {
      const parsedClass = parseClass(segment);
      if (parsedClass !== undefined) {
        classes.push({
          name: parsedClass.name,
          modifiers: parsedClass.modifiers,
          ...(parsedClass.extendsName
            ? { extendsName: parsedClass.extendsName }
            : {}),
          implementsNames: [...parsedClass.implementsNames].sort(compareLex),
          methodCount: parsedClass.methodCount,
        });

        const bodyStart = segment.indexOf('{');
        if (bodyStart !== -1) {
          const body = scanBalanced(segment, bodyStart, '{', '}').text;
          for (const member of collectDeclarationSegments(body)) {
            const method = parseFunctionLike(member, {
              receiver: parsedClass.name,
              allowedModifiers: ['async', 'external', 'static'],
            });
            if (method !== undefined && 'key' in method) {
              methods.push(method);
            }
          }
        }
      }
      continue;
    }

    const functionSymbol = parseFunctionLike(segment, {
      allowedModifiers: ['async', 'external'],
    });
    if (functionSymbol !== undefined && !('key' in functionSymbol)) {
      functions.push(functionSymbol);
    }
  }

  return {
    functions: functions.sort((left, right) =>
      compareLex(left.name, right.name),
    ),
    methods: methods.sort((left, right) => compareLex(left.key, right.key)),
    classes: classes.sort((left, right) => compareLex(left.name, right.name)),
  };
};

export const extractDartSymbols = (input: RuleRunInput): DartSymbols => {
  if (input.language !== 'dart') {
    throw new InternalError(
      `symbol_extract_error: unsupported language "${input.language}"`,
    );
  }

  try {
    return extractDartSymbolsInternal(input.source);
  } catch {
    throw new InternalError('symbol_extract_error: failed to extract symbols');
  }
};
