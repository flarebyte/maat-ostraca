import { children, literal, nodes, type SwiftNode, unique } from './ast.js';
import { inheritedNames, swiftFunctions, swiftKey } from './symbols.js';

const argumentLiteral = (
  argument: SwiftNode | undefined,
): string | undefined => {
  if (!argument) return undefined;
  const values = children(argument).filter(
    (child) => child.kind() !== 'value_argument_label',
  );
  return values.length === 1 ? literal(values[0]) : undefined;
};
export const swiftCalls = (root: SwiftNode) =>
  nodes(root, 'call_expression').map((node) => {
    const parts = children(node);
    const suffix = parts.find((child) => child.kind() === 'call_suffix');
    const argumentsNode =
      suffix &&
      children(suffix).find((child) => child.kind() === 'value_arguments');
    const args = argumentsNode
      ? children(argumentsNode).filter(
          (child) => child.kind() === 'value_argument',
        )
      : [];
    return {
      node,
      name: parts[0]?.text().replace(/\s/g, '') ?? '',
      args,
      first: argumentLiteral(args[0]),
    };
  });
export const swiftEnvironment = (root: SwiftNode) =>
  unique(
    swiftCalls(root)
      .filter((call) =>
        [
          'getenv',
          'Darwin.getenv',
          'Glibc.getenv',
          'ProcessInfo.processInfo.environment',
          'Foundation.ProcessInfo.processInfo.environment',
        ].includes(call.name),
      )
      .flatMap((call) => (call.first === undefined ? [] : [call.first])),
  );
export const swiftMessages = (root: SwiftNode, exceptions: boolean): string[] =>
  unique(
    swiftCalls(root)
      .filter((call) =>
        exceptions
          ? [
              'fatalError',
              'preconditionFailure',
              'Swift.fatalError',
              'Swift.preconditionFailure',
            ].includes(call.name) ||
            (call.node.parent()?.kind() === 'control_transfer_statement' &&
              call.node
                .parent()
                ?.children()
                .some((child) => child.text() === 'throw') &&
              /^(?:message|description|reason)?$/.test(
                call.args[0]?.field('name')?.text() ?? '',
              ))
          : /^(?:logger|log|Logger)\.(?:error|fault|critical)$/.test(call.name),
      )
      .flatMap((call) => (call.first === undefined ? [] : [call.first])),
  );
export const swiftIo = (root: SwiftNode) => {
  let read = 0,
    write = 0;
  for (const call of swiftCalls(root)) {
    if (
      call.name === 'readLine' ||
      /\.(?:read|readDataToEndOfFile|readToEnd|readData)$/.test(call.name) ||
      (['String', 'Data', 'Foundation.String', 'Foundation.Data'].includes(
        call.name,
      ) &&
        call.args.some((arg) =>
          /^(?:contentsOf|contentsOfFile|contentsOfURL)\s*:/.test(arg.text()),
        ))
    )
      read++;
    if (
      [
        'print',
        'debugPrint',
        'dump',
        'Swift.print',
        'Swift.debugPrint',
      ].includes(call.name) ||
      /\.(?:write|writeData|writeAll)$/.test(call.name)
    )
      write++;
  }
  return { all: read + write, read, write };
};
export const swiftTests = (root: SwiftNode): string[] =>
  unique(
    swiftFunctions(root).flatMap((node) => {
      const attrs = children(node).find(
        (child) => child.kind() === 'modifiers',
      );
      const test =
        attrs &&
        nodes(attrs, 'attribute').find((attr) =>
          /^@(?:Testing\.)?Test\b/.test(attr.text()),
        );
      if (test) {
        const label = children(test)
          .map(literal)
          .find((value) => value !== undefined);
        return [label ?? swiftKey(node)];
      }
      const type = node
        .ancestors()
        .find((parent) => parent.kind() === 'class_declaration');
      return type &&
        inheritedNames(type).some((name) =>
          ['XCTestCase', 'XCTest.XCTestCase'].includes(name),
        ) &&
        /^test/.test(node.field('name')?.text() ?? '')
        ? [swiftKey(node)]
        : [];
    }),
  );
