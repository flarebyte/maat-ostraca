import {
  descendants,
  fieldText,
  named,
  type RustNode,
  sorted,
  stringValue,
} from './ast.js';
import { resolveRustName } from './imports.js';

const macroArgs = (node: RustNode): RustNode | undefined =>
  named(node).find((child) => child.kind() === 'token_tree');
const firstLiteral = (node: RustNode): string | undefined => {
  if (node.kind() !== 'macro_invocation')
    return stringValue(
      node
        .field('arguments')
        ?.children()
        .find(
          (child) =>
            child.isNamed() && !String(child.kind()).endsWith('_comment'),
        ) ?? null,
    );
  const args = macroArgs(node);
  if (!args) return undefined;
  const tokens = args
    .children()
    .slice(1, -1)
    .filter((child) => !String(child.kind()).endsWith('_comment'));
  const first = tokens[0];
  const next = tokens[1];
  return first && (!next || next.text() === ',')
    ? stringValue(first)
    : undefined;
};
const functionName = (node: RustNode): string => {
  const fn = node.field('function');
  if (!fn) return '';
  if (fn.kind() === 'generic_function') return fieldText(fn, 'function');
  return fn.text();
};
export const rustCalls = (root: RustNode) => {
  const resolve = resolveRustName(root);
  return [
    ...descendants(root, 'call_expression'),
    ...descendants(root, 'macro_invocation'),
  ].map((node) => ({
    node,
    macro: node.kind() === 'macro_invocation',
    name: resolve(
      node.kind() === 'macro_invocation'
        ? fieldText(node, 'macro')
        : functionName(node),
    ),
    literal: firstLiteral(node),
  }));
};
export const rustEnv = (root: RustNode): string[] =>
  sorted(
    rustCalls(root)
      .filter((call) =>
        call.macro
          ? [
              'env',
              'option_env',
              'std::env',
              'std::option_env',
              'core::env',
              'core::option_env',
            ].includes(call.name)
          : ['std::env::var', 'std::env::var_os'].includes(call.name),
      )
      .flatMap((call) => (call.literal === undefined ? [] : [call.literal])),
  );
export const rustMessages = (root: RustNode, exceptions: boolean): string[] =>
  sorted(
    rustCalls(root)
      .filter((call) =>
        exceptions
          ? call.macro &&
            ['panic', 'std::panic', 'core::panic'].includes(call.name)
          : call.macro
            ? [
                'anyhow',
                'anyhow::anyhow',
                'bail',
                'anyhow::bail',
                'log::error',
                'tracing::error',
              ].includes(call.name)
            : [
                'Err',
                'Result::Err',
                'std::result::Result::Err',
                'std::io::Error::new',
                'std::io::Error::other',
              ].includes(call.name),
      )
      .flatMap((call) => {
        // Error::new takes its message as the second argument.
        const value =
          call.name === 'std::io::Error::new'
            ? stringValue(
                call.node
                  .field('arguments')
                  ?.children()
                  .filter(
                    (child) =>
                      child.isNamed() &&
                      !String(child.kind()).endsWith('_comment'),
                  )[1] ?? null,
              )
            : call.literal;
        return value === undefined ? [] : [value];
      }),
  );
export const rustIo = (node: RustNode, context = node) => {
  let read = 0;
  let write = 0;
  // Resolve aliases using the complete file, but count only this declaration.
  const resolve = resolveRustName(context);
  for (const call of rustCalls(node)) {
    const name = resolve(call.name);
    if (call.macro) {
      if (
        /^(?:(?:std|core)::)?(?:print|println|eprint|eprintln|write|writeln)$/.test(
          name,
        )
      )
        write++;
    } else {
      if (
        [
          'std::fs::read',
          'std::fs::read_to_string',
          'std::io::read_to_string',
        ].includes(name) ||
        /\.(?:read|read_exact|read_to_end|read_to_string|read_line)$/.test(name)
      )
        read++;
      if (
        name === 'std::fs::write' ||
        /\.(?:write|write_all|write_fmt|flush)$/.test(name)
      )
        write++;
    }
  }
  return { all: read + write, read, write };
};
