import { createHash } from 'node:crypto';
import { parse } from '@ast-grep/napi';
import { ensurePython } from '../../../core/astgrep/python.js';
import type { RuleRunInput } from '../../dispatch.js';

export const runPython = (input: RuleRunInput, rule: string): unknown => {
  ensurePython();
  const root = parse('python', input.source).root();
  type Node = typeof root;
  const nodes = (node: Node, kind: string): Node[] =>
    node.findAll({ rule: { kind } });
  const hash = (text: string) =>
    createHash('sha256').update(text).digest('hex');
  const sorted = (items: string[]) => [...new Set(items)].sort();
  const metrics = (node: Node) => {
    const source = node.text();
    const loops =
      nodes(node, 'for_statement').length +
      nodes(node, 'while_statement').length;
    const conditions =
      nodes(node, 'if_statement').length +
      nodes(node, 'elif_clause').length +
      nodes(node, 'case_clause').length;
    const depth = (n: Node, level = 0): number =>
      Math.max(
        level,
        ...n
          .children()
          .map((c) => depth(c, level + (c.kind() === 'block' ? 1 : 0))),
      );
    return {
      loc: source ? source.split('\n').length : 0,
      sloc: source.split('\n').filter((l) => l.trim()).length,
      loops,
      conditions,
      cyclomaticComplexity: source ? 1 + loops + conditions : 0,
      cognitiveComplexity: source ? 1 + loops + conditions : 0,
      maxNestingDepth: depth(node),
      tokens: nodes(node, 'identifier').length,
    };
  };
  const imports = [
    ...nodes(root, 'import_statement'),
    ...nodes(root, 'import_from_statement'),
  ];
  if (rule === 'code_hash')
    return { algorithm: 'sha256', file: hash(input.source) };
  if (rule === 'file_metrics') return metrics(root);
  if (rule === 'import_files_list' || rule === 'package_imports_list') {
    const modules = imports
      .flatMap((n) => {
        if (n.kind() === 'import_from_statement')
          return [n.field('module_name')?.text() ?? ''];
        return n
          .children()
          .filter((c) =>
            ['dotted_name', 'aliased_import'].includes(String(c.kind())),
          )
          .map((c) =>
            c.kind() === 'aliased_import'
              ? (c.field('name')?.text() ?? '')
              : c.text(),
          );
      })
      .filter(Boolean);
    return sorted(
      rule === 'package_imports_list'
        ? modules.filter((m) => !m.startsWith('.'))
        : modules,
    );
  }
  const literal = (node: Node | null): string | undefined => {
    if (node?.kind() !== 'string' || nodes(node, 'interpolation').length)
      return undefined;
    const text = node.text();
    const match = text.match(/^[rRuU]*("""|'''|"|')([\s\S]*)\1$/);
    return match?.[2];
  };
  const calls = (node: Node) => nodes(node, 'call');
  const aliases = new Map<string, string>();
  for (const statement of imports) {
    for (const alias of nodes(statement, 'aliased_import')) {
      const name = alias.field('name')?.text();
      const local = alias.field('alias')?.text();
      const module = statement.field('module_name')?.text();
      if (name && local)
        aliases.set(local, module ? `${module}.${name}` : name);
    }
    if (statement.kind() === 'import_from_statement') {
      const module = statement.field('module_name')?.text();
      for (const child of statement.children()) {
        if (module && child.kind() === 'dotted_name' && child.text() !== module)
          aliases.set(child.text(), `${module}.${child.text()}`);
      }
    }
  }
  const resolveName = (name: string) => {
    const [head = '', ...tail] = name.split('.');
    return [aliases.get(head) ?? head, ...tail].join('.');
  };
  const callName = (node: Node) =>
    resolveName(node.field('function')?.text() ?? '');
  const firstArg = (node: Node) =>
    node
      .field('arguments')
      ?.children()
      .find((c) => c.isNamed()) ?? null;
  const io = (node: Node) => {
    let read = 0;
    let write = 0;
    for (const call of calls(node)) {
      const name = callName(call);
      if (
        ['input', 'os.read'].includes(name) ||
        /\.(read|readline|readlines|read_text|read_bytes)$/.test(name)
      )
        read++;
      if (
        ['print', 'os.write'].includes(name) ||
        /\.(write|writelines|write_text|write_bytes)$/.test(name)
      )
        write++;
    }
    return { all: read + write, read, write };
  };
  if (rule === 'env_names_list')
    return sorted(
      [
        ...calls(root)
          .filter((n) => ['os.getenv', 'os.environ.get'].includes(callName(n)))
          .map((n) => literal(firstArg(n))),
        ...nodes(root, 'subscript')
          .filter(
            (n) => resolveName(n.field('value')?.text() ?? '') === 'os.environ',
          )
          .map((n) => literal(n.field('subscript'))),
      ].filter((s): s is string => s !== undefined),
    );
  if (rule === 'exception_messages_list' || rule === 'error_messages_list') {
    const selected =
      rule === 'exception_messages_list'
        ? nodes(root, 'raise_statement').flatMap((n) => calls(n))
        : calls(root).filter((n) =>
            /^(logging|logger)\.(error|exception|critical)$/.test(callName(n)),
          );
    return sorted(
      selected
        .map((n) => literal(firstArg(n)))
        .filter((s): s is string => s !== undefined),
    );
  }
  const functions = nodes(root, 'function_definition');
  const key = (node: Node): string => {
    const parts = [node.field('name')?.text() ?? ''];
    let parent = node.parent();
    while (parent) {
      if (
        ['class_definition', 'function_definition'].includes(
          String(parent.kind()),
        )
      )
        parts.unshift(parent.field('name')?.text() ?? '');
      parent = parent.parent();
    }
    return parts.join('.');
  };
  const isMethod = (node: Node) => {
    let parent = node.parent();
    while (
      parent &&
      parent.kind() !== 'function_definition' &&
      parent.kind() !== 'class_definition'
    )
      parent = parent.parent();
    return parent?.kind() === 'class_definition';
  };
  if (rule === 'testcase_titles_list')
    return sorted(
      functions
        .filter((n) => (n.field('name')?.text() ?? '').startsWith('test_'))
        .map((n) => key(n)),
    );
  if (rule.startsWith('io_')) {
    const counts = (method: boolean) =>
      Object.fromEntries(
        functions
          .filter((n) => isMethod(n) === method)
          .map((n) => [
            key(n),
            io(n)[
              rule === 'io_read_calls_count'
                ? 'read'
                : rule === 'io_write_calls_count'
                  ? 'write'
                  : 'all'
            ],
          ]),
      );
    return { functions: counts(false), methods: counts(true) };
  }
  const classMetrics = (node: Node) => {
    const value = metrics(node);
    return {
      loc: value.loc,
      sloc: value.sloc,
      cyclomaticComplexity: value.cyclomaticComplexity,
      cognitiveComplexity: value.cognitiveComplexity,
      maxNestingDepth: value.maxNestingDepth,
      tokens: value.tokens,
    };
  };
  if (rule === 'class_map')
    return Object.fromEntries(
      nodes(root, 'class_definition').map((n) => [
        key(n),
        {
          modifiers: [],
          ...(n.field('superclasses')
            ? { extends: (n.field('superclasses')?.text() ?? '').slice(1, -1) }
            : {}),
          ...classMetrics(n),
          sha256: hash(n.text()),
          methodCount: functions.filter(
            (f) =>
              isMethod(f) &&
              key(f).slice(0, key(f).lastIndexOf('.')) === key(n),
          ).length,
        },
      ]),
    );
  if (rule === 'function_map' || rule === 'method_map')
    return Object.fromEntries(
      functions
        .filter((n) => isMethod(n) === (rule === 'method_map'))
        .map((n) => {
          const name = n.field('name')?.text() ?? '';
          return [
            key(n),
            {
              modifiers: [
                ...(n.text().startsWith('async ') ? ['async'] : []),
                ...(n.parent()?.kind() === 'decorated_definition'
                  ? (n
                      .parent()
                      ?.children()
                      .filter((c) => c.kind() === 'decorator')
                      .map((c) => c.text().slice(1)) ?? [])
                  : []),
              ],
              params:
                n
                  .field('parameters')
                  ?.children()
                  .filter((c) => c.isNamed())
                  .map((c) => c.text()) ?? [],
              returns: n.field('return_type')
                ? [n.field('return_type')?.text() ?? '']
                : [],
              ...(isMethod(n)
                ? { name, receiver: key(n).slice(0, -(name.length + 1)) }
                : {}),
              ...metrics(n),
              sha256: hash(n.text()),
              returnCount: nodes(n, 'return_statement').length,
              ioCallsCount: io(n).all,
              ioReadCallsCount: io(n).read,
              ioWriteCallsCount: io(n).write,
            },
          ];
        }),
    );
  throw new Error(`Unsupported Python rule: ${rule}`);
};
