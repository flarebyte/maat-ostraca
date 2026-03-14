import { InternalError } from '../../../core/errors/index.js';
import type { RuleRunInput } from '../../dispatch.js';

interface GoInterfaceSymbol {
  name: string;
  modifiers: string[];
  extendsNames: string[];
  methods: string[];
  code: string;
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

const splitInterfaceMembers = (body: string): string[] => {
  const members: string[] = [];
  let start = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;

  for (let index = 0; index < body.length; index += 1) {
    const char = body[index];
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
      (char === '\n' || char === ';') &&
      parenDepth === 0 &&
      bracketDepth === 0 &&
      braceDepth === 0
    ) {
      const member = body.slice(start, index).trim();
      if (member.length > 0) {
        members.push(member);
      }
      start = index + 1;
    }
  }

  const trailing = body.slice(start).trim();
  if (trailing.length > 0) {
    members.push(trailing);
  }

  return members;
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
      source.startsWith('type', index) &&
      !isIdentifierPart(source[index - 1]) &&
      !isIdentifierPart(source[index + 4])
    ) {
      const declarationStart = index;
      let cursor = skipWhitespaceAndComments(source, index + 4);
      const name = scanIdentifier(source, cursor);
      if (!name) {
        index += 4;
        continue;
      }

      cursor = skipWhitespaceAndComments(source, name.end);
      if (
        !source.startsWith('interface', cursor) ||
        isIdentifierPart(source[cursor + 'interface'.length])
      ) {
        index = cursor;
        continue;
      }

      cursor = skipWhitespaceAndComments(source, cursor + 'interface'.length);
      if (source[cursor] !== '{') {
        index = cursor;
        continue;
      }

      const body = scanBalanced(source, cursor, '{', '}');
      const parsedMembers = parseInterfaceMembers(body.text);

      interfaces.push({
        name: name.text,
        modifiers: [],
        extendsNames: parsedMembers.extendsNames,
        methods: parsedMembers.methods,
        code: source.slice(declarationStart, body.end),
      });

      index = body.end;
      continue;
    }

    index += 1;
  }

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
