import type { RuleName } from '../../catalog.js';
import type { RuleRunInput } from '../../dispatch.js';
import {
  buildInterfaceMap,
  computeCodeHashResult,
  toFileMetricsResult,
} from '../common.js';
import { buildSymbolMetricsIoFieldsFromMetrics } from '../typescript/symbol_metrics_io.js';
import {
  nodes,
  swiftImports,
  swiftModifiers,
  swiftRoot,
  textField,
  unique,
} from './ast.js';
import {
  swiftEnvironment,
  swiftIo,
  swiftMessages,
  swiftTests,
} from './calls.js';
import { swiftMetrics } from './metrics.js';
import {
  inheritedNames,
  receiver,
  swiftFunctions,
  swiftKey,
  swiftName,
  swiftProtocols,
  swiftSignature,
} from './symbols.js';

export const runSwift = (input: RuleRunInput, rule: RuleName): unknown => {
  const root = swiftRoot(input);
  const hash = (source: string) =>
    computeCodeHashResult(source, 'swift_hash_error: failed to compute hash');
  const metrics = (node: typeof root) =>
    buildSymbolMetricsIoFieldsFromMetrics(
      swiftMetrics(node),
      hash(node.text()).file,
      swiftIo(node),
    );
  const symbols = () =>
    swiftFunctions(root).map((node) => ({
      node,
      key: swiftKey(node),
      receiver: receiver(node),
    }));
  const maps = () =>
    Object.fromEntries(
      symbols()
        .filter((symbol) => !!symbol.receiver === (rule === 'method_map'))
        .map((symbol) => [
          symbol.key,
          {
            ...swiftSignature(symbol.node),
            ...(symbol.receiver
              ? { name: swiftName(symbol.node), receiver: symbol.receiver }
              : {}),
            ...metrics(symbol.node),
          },
        ]),
    );
  const ioMaps = () => {
    const mode =
      rule === 'io_calls_count'
        ? 'all'
        : rule === 'io_read_calls_count'
          ? 'read'
          : 'write';
    const counts = (method: boolean) =>
      Object.fromEntries(
        symbols()
          .filter((symbol) => !!symbol.receiver === method)
          .map((symbol) => [symbol.key, swiftIo(symbol.node)[mode]]),
      );
    return { functions: counts(false), methods: counts(true) };
  };
  const classes = () => {
    const protocols = new Set(
      swiftProtocols(root).map((protocol) => protocol.name),
    );
    const declarations = nodes(root, 'class_declaration').filter(
      (node) => textField(node, 'declaration_kind') === 'class',
    );
    const knownClasses = new Set(
      declarations.map((node) => textField(node, 'name')),
    );
    return Object.fromEntries(
      declarations.map((node) => {
        const name = [
          ...node
            .ancestors()
            .filter((parent) => parent.kind() === 'class_declaration')
            .reverse()
            .map((parent) => textField(parent, 'name')),
          textField(node, 'name'),
        ].join('.');
        const inherited = inheritedNames(node);
        const parent = inherited.find((type) =>
          knownClasses.has(type.split('<')[0] ?? type),
        );
        const implementsNames = inherited.filter((type) => protocols.has(type));
        const value = swiftMetrics(node);
        return [
          name,
          {
            modifiers: swiftModifiers(node),
            ...(parent ? { extends: parent } : {}),
            ...(implementsNames.length ? { implements: implementsNames } : {}),
            methodCount: symbols().filter((symbol) => symbol.receiver === name)
              .length,
            loc: value.loc,
            sloc: value.sloc,
            cyclomaticComplexity: value.cyclomaticComplexity,
            cognitiveComplexity: value.cognitiveComplexity,
            maxNestingDepth: value.maxNestingDepth,
            tokens: value.tokens,
            sha256: hash(node.text()).file,
          },
        ];
      }),
    );
  };
  const handlers: Partial<Record<RuleName, () => unknown>> = {
    code_hash: () => hash(input.source),
    file_metrics: () => toFileMetricsResult(swiftMetrics(root, input.source)),
    import_files_list: () => swiftImports(root),
    package_imports_list: () =>
      unique(swiftImports(root).map((path) => path.split('.')[0] ?? '')),
    function_map: maps,
    method_map: maps,
    class_map: classes,
    interface_map: () => buildInterfaceMap(swiftProtocols(root)),
    interfaces_code_map: () =>
      Object.fromEntries(
        swiftProtocols(root).map((protocol) => [protocol.name, protocol.code]),
      ),
    env_names_list: () => swiftEnvironment(root),
    exception_messages_list: () => swiftMessages(root, true),
    error_messages_list: () => swiftMessages(root, false),
    testcase_titles_list: () => swiftTests(root),
    io_calls_count: ioMaps,
    io_read_calls_count: ioMaps,
    io_write_calls_count: ioMaps,
  };
  const handler = handlers[rule];
  if (!handler) throw new Error(`Unsupported Swift rule: ${rule}`);
  return handler();
};
