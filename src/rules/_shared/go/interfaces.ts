import { InternalError } from '../../../core/errors/index.js';
import type { RuleRunInput } from '../../dispatch.js';
import {
  forEachGoTopLevel,
  isGoIdentifierPart,
  matchesGoKeyword,
  scanGoBalanced,
  scanGoIdentifier,
  skipGoWhitespaceAndComments,
  splitGoTopLevelSegments,
} from './lexing.js';

interface GoInterfaceSymbol {
  name: string;
  modifiers: string[];
  extendsNames: string[];
  methods: string[];
  code: string;
}

const compareLex = (left: string, right: string): number =>
  left.localeCompare(right);

const splitInterfaceMembers = (body: string): string[] => {
  return splitGoTopLevelSegments(body, ['\n', ';']);
};

const isSimpleEmbeddedName = (member: string): boolean => {
  return /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?$/.test(member);
};

// Go interfaces do not have a literal `extends` keyword. In this rule, the
// `extends` field represents simple named embedded interface/type entries from
// the interface body, such as `Reader` or `io.Closer`.
const parseInterfaceMembers = (
  body: string,
): { extendsNames: string[]; methods: string[] } => {
  const extendsNames: string[] = [];
  const methods: string[] = [];

  for (const member of splitInterfaceMembers(body)) {
    if (member.includes('(')) {
      methods.push(member.trim());
      continue;
    }

    if (isSimpleEmbeddedName(member)) {
      extendsNames.push(member);
    }
  }

  return {
    extendsNames: [...extendsNames].sort(compareLex),
    methods: [...methods].sort(compareLex),
  };
};

const extractGoInterfacesInternal = (source: string): GoInterfaceSymbol[] => {
  const interfaces: GoInterfaceSymbol[] = [];
  forEachGoTopLevel(source, (index) => {
    if (!matchesGoKeyword(source, index, 'type')) {
      return undefined;
    }

    const declarationStart = index;
    let cursor = skipGoWhitespaceAndComments(source, index + 4);
    const name = scanGoIdentifier(source, cursor);
    if (!name) {
      return index + 4;
    }

    cursor = skipGoWhitespaceAndComments(source, name.end);
    if (
      !source.startsWith('interface', cursor) ||
      isGoIdentifierPart(source[cursor + 'interface'.length])
    ) {
      return cursor;
    }

    cursor = skipGoWhitespaceAndComments(source, cursor + 'interface'.length);
    if (source[cursor] !== '{') {
      return cursor;
    }

    const body = scanGoBalanced(source, cursor, '{', '}');
    const parsedMembers = parseInterfaceMembers(body.text);

    interfaces.push({
      name: name.text,
      modifiers: [],
      extendsNames: parsedMembers.extendsNames,
      methods: parsedMembers.methods,
      code: source.slice(declarationStart, body.end),
    });

    return body.end;
  });

  return interfaces.sort((left, right) => compareLex(left.name, right.name));
};

export const extractGoInterfaces = (
  input: RuleRunInput,
): GoInterfaceSymbol[] => {
  if (input.language !== 'go') {
    throw new InternalError(
      `interface_extract_error: unsupported language "${input.language}"`,
    );
  }

  try {
    return extractGoInterfacesInternal(input.source);
  } catch {
    throw new InternalError(
      'interface_extract_error: failed to extract interfaces',
    );
  }
};
