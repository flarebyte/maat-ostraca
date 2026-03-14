import { InternalError } from '../../../core/errors/index.js';
import type { RuleRunInput } from '../../dispatch.js';

interface DartInterfaceSymbol {
  name: string;
  modifiers: string[];
  extendsNames: string[];
  methods: string[];
  code: string;
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

const splitTopLevelCommaList = (value: string): string[] => {
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

    if (
      char === ',' &&
      parenDepth === 0 &&
      braceDepth === 0 &&
      bracketDepth === 0 &&
      angleDepth === 0
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

const extractAbstractMethodSignature = (
  segment: string,
  receiver: string,
): string | undefined => {
  if (!segment.endsWith(';')) {
    return undefined;
  }
  if (segment.includes('{') || segment.includes('=>')) {
    return undefined;
  }

  const paramsStart = findParameterStart(segment);
  if (paramsStart === undefined) {
    return undefined;
  }

  scanBalanced(segment, paramsStart, '(', ')');
  const beforeParams = segment.slice(0, paramsStart).trimEnd();
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
  if (
    name === receiver ||
    prefix === 'get' ||
    prefix.endsWith(' get') ||
    prefix === 'set' ||
    prefix.endsWith(' set') ||
    prefix.startsWith('factory ') ||
    prefix.startsWith('operator ')
  ) {
    return undefined;
  }

  return segment.replace(/;\s*$/, '').trim();
};

// Dart v1 interface interpretation:
// - only `abstract class` declarations are treated as interface-like symbols
// - non-abstract classes are excluded
// - `extends` and `implements` names are merged into the `extends` field
// - only abstract method declarations without bodies are included in `methods`
export const extractDartInterfaces = (
  input: RuleRunInput,
): DartInterfaceSymbol[] => {
  if (input.language !== 'dart') {
    throw new InternalError(
      `interface_extract_error: unsupported language "${input.language}"`,
    );
  }

  try {
    const interfaces: DartInterfaceSymbol[] = [];

    for (const segment of collectDeclarationSegments(input.source)) {
      if (!segment.startsWith('abstract class ')) {
        continue;
      }

      const bodyStart = segment.indexOf('{');
      if (bodyStart === -1) {
        continue;
      }

      const header = segment.slice(0, bodyStart).trim();
      const match = header.match(
        /^abstract\s+class\s+([A-Za-z_$][A-Za-z0-9_$]*)\b([\s\S]*)$/,
      );
      if (!match) {
        continue;
      }

      const name = match[1];
      const headerTail = match[2]?.trim() ?? '';
      if (name === undefined) {
        continue;
      }

      const body = scanBalanced(segment, bodyStart, '{', '}').text;
      const methods = collectDeclarationSegments(body)
        .map((member) => extractAbstractMethodSignature(member, name))
        .filter((member): member is string => member !== undefined)
        .sort(compareLex);

      const extendsNames = [
        ...(headerTail.match(
          /\bextends\s+(.+?)(?=\s+(?:implements|with)\b|$)/,
        )?.[1]
          ? splitTopLevelCommaList(
              headerTail.match(
                /\bextends\s+(.+?)(?=\s+(?:implements|with)\b|$)/,
              )?.[1] ?? '',
            )
          : []),
        ...(headerTail.match(/\bimplements\s+(.+?)(?=\s+with\b|$)/)?.[1]
          ? splitTopLevelCommaList(
              headerTail.match(/\bimplements\s+(.+?)(?=\s+with\b|$)/)?.[1] ??
                '',
            )
          : []),
      ]
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);

      interfaces.push({
        name,
        modifiers: ['abstract'],
        extendsNames: [...new Set(extendsNames)].sort(compareLex),
        methods,
        code: segment,
      });
    }

    return interfaces.sort((left, right) => compareLex(left.name, right.name));
  } catch {
    throw new InternalError(
      'interface_extract_error: failed to extract interfaces',
    );
  }
};
