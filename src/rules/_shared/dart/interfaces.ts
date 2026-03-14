import { InternalError } from '../../../core/errors/index.js';
import type { RuleRunInput } from '../../dispatch.js';
import {
  collectDartDeclarationSegments,
  compareDartLex,
  findDartParameterStart,
  isDartIdentifierPart,
  readDartDeclarationSegment,
  scanDartBalanced,
  splitDartTopLevelCommaList,
} from './lexing.js';

interface DartInterfaceSymbol {
  name: string;
  modifiers: string[];
  extendsNames: string[];
  methods: string[];
  code: string;
}

const findParameterStart = (segment: string): number | undefined => {
  return findDartParameterStart(segment);
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

  scanDartBalanced(segment, paramsStart, '(', ')');
  const beforeParams = segment.slice(0, paramsStart).trimEnd();
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

    for (const segment of collectDartDeclarationSegments(
      input.source,
      readDartDeclarationSegment,
    )) {
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

      const body = scanDartBalanced(segment, bodyStart, '{', '}').text;
      const methods = collectDartDeclarationSegments(
        body,
        readDartDeclarationSegment,
      )
        .map((member) => extractAbstractMethodSignature(member, name))
        .filter((member): member is string => member !== undefined)
        .sort(compareDartLex);

      const extendsNames = [
        ...(headerTail.match(
          /\bextends\s+(.+?)(?=\s+(?:implements|with)\b|$)/,
        )?.[1]
          ? splitDartTopLevelCommaList(
              headerTail.match(
                /\bextends\s+(.+?)(?=\s+(?:implements|with)\b|$)/,
              )?.[1] ?? '',
            )
          : []),
        ...(headerTail.match(/\bimplements\s+(.+?)(?=\s+with\b|$)/)?.[1]
          ? splitDartTopLevelCommaList(
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
        extendsNames: [...new Set(extendsNames)].sort(compareDartLex),
        methods,
        code: segment,
      });
    }

    return interfaces.sort((left, right) =>
      compareDartLex(left.name, right.name),
    );
  } catch {
    throw new InternalError(
      'interface_extract_error: failed to extract interfaces',
    );
  }
};
