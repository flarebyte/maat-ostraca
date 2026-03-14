import { InternalError } from '../../../core/errors/index.js';
import type { RuleRunInput } from '../../dispatch.js';
import { lowerCamel, upperCamelSegment } from '../common.js';
import {
  collectDartDeclarationSegments,
  compareDartLex,
  findDartParameterStart,
  isDartIdentifierPart,
  readDartDeclarationSegment,
  scanDartBalanced,
  splitDartTopLevelCommaList,
} from './lexing.js';

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
  code: string;
}

interface DartSymbols {
  functions: DartFunctionSymbol[];
  methods: DartMethodSymbol[];
  classes: DartClassSymbol[];
}

const parseParams = (value: string): string[] => {
  return splitDartTopLevelCommaList(value, {
    unwrapOptionalGroups: true,
  }).filter((entry) => entry.length > 0);
};

const sortModifiers = (
  value: ReadonlyArray<string>,
  allowed: ReadonlyArray<string>,
): string[] => {
  return [...new Set(value.filter((item) => allowed.includes(item)))].sort(
    compareDartLex,
  );
};

const parseFunctionLike = (
  segment: string,
  options: {
    receiver?: string;
    allowedModifiers: readonly string[];
  },
): DartFunctionSymbol | DartMethodSymbol | undefined => {
  const paramsStart = findDartParameterStart(segment);
  if (paramsStart === undefined) {
    return undefined;
  }

  const params = scanDartBalanced(segment, paramsStart, '(', ')');
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
  while (nameStart > 0 && isDartIdentifierPart(beforeParams[nameStart - 1])) {
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

  const body = scanDartBalanced(segment, bodyStart, '{', '}').text;
  const methods = collectDartDeclarationSegments(
    body,
    readDartDeclarationSegment,
  )
    .map((member) =>
      parseFunctionLike(member, {
        receiver: name,
        allowedModifiers: ['async', 'external', 'static'],
      }),
    )
    .filter((symbol): symbol is DartMethodSymbol => symbol !== undefined)
    .sort((left, right) => compareDartLex(left.key, right.key));

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
      ? splitDartTopLevelCommaList(implementsMatch[1]).map((entry) =>
          entry.trim(),
        )
      : [],
    methodCount: methods.length,
    code: segment,
  };
};

const extractDartSymbolsInternal = (source: string): DartSymbols => {
  const functions: DartFunctionSymbol[] = [];
  const methods: DartMethodSymbol[] = [];
  const classes: DartClassSymbol[] = [];

  for (const segment of collectDartDeclarationSegments(
    source,
    readDartDeclarationSegment,
  )) {
    if (segment.startsWith('class ') || segment.startsWith('abstract class ')) {
      const parsedClass = parseClass(segment);
      if (parsedClass !== undefined) {
        classes.push({
          name: parsedClass.name,
          modifiers: parsedClass.modifiers,
          ...(parsedClass.extendsName
            ? { extendsName: parsedClass.extendsName }
            : {}),
          implementsNames: [...parsedClass.implementsNames].sort(
            compareDartLex,
          ),
          methodCount: parsedClass.methodCount,
          code: parsedClass.code,
        });

        const bodyStart = segment.indexOf('{');
        if (bodyStart !== -1) {
          const body = scanDartBalanced(segment, bodyStart, '{', '}').text;
          for (const member of collectDartDeclarationSegments(
            body,
            readDartDeclarationSegment,
          )) {
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
      compareDartLex(left.name, right.name),
    ),
    methods: methods.sort((left, right) => compareDartLex(left.key, right.key)),
    classes: classes.sort((left, right) =>
      compareDartLex(left.name, right.name),
    ),
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
