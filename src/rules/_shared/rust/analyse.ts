import type { RuleName } from '../../catalog.js';
import type { RuleRunInput } from '../../dispatch.js';
import { buildInterfaceMap, toFileMetricsResult } from '../common.js';
import { buildSymbolMetricsIoFieldsFromMetrics } from '../typescript/symbol_metrics_io.js';
import { fieldText, parseRust, type RustNode } from './ast.js';
import { rustEnv, rustIo, rustMessages } from './calls.js';
import { importPaths, packagePaths } from './imports.js';
import { rustHash, rustMetrics } from './metrics.js';
import {
  isRustMethod,
  rustFunctions,
  rustInterfaces,
  rustTests,
  signature,
  symbolKey,
} from './symbols.js';

const symbolMetrics = (node: RustNode, root: RustNode) =>
  buildSymbolMetricsIoFieldsFromMetrics(
    rustMetrics(node),
    rustHash(node.text()),
    rustIo(node, root),
  );
export const runRust = (input: RuleRunInput, rule: RuleName): unknown => {
  const root = parseRust(input);
  switch (rule) {
    case 'code_hash':
      return { algorithm: 'sha256', file: rustHash(input.source) };
    case 'file_metrics':
      return toFileMetricsResult(rustMetrics(root, input.source));
    case 'import_files_list':
      return importPaths(root);
    case 'package_imports_list':
      return packagePaths(root);
    case 'env_names_list':
      return rustEnv(root);
    case 'exception_messages_list':
      return rustMessages(root, true);
    case 'error_messages_list':
      return rustMessages(root, false);
    case 'testcase_titles_list':
      return rustTests(root);
    case 'interface_map':
      return buildInterfaceMap(rustInterfaces(root));
    case 'interfaces_code_map':
      return Object.fromEntries(
        rustInterfaces(root).map((trait) => [trait.name, trait.code]),
      );
    case 'function_map':
    case 'method_map': {
      const method = rule === 'method_map';
      return Object.fromEntries(
        rustFunctions(root)
          .filter((node) => isRustMethod(node) === method)
          .map((node) => {
            const key = symbolKey(node);
            const name = fieldText(node, 'name');
            return [
              key,
              {
                ...signature(node),
                ...(method
                  ? { name, receiver: key.slice(0, -(name.length + 2)) }
                  : {}),
                ...symbolMetrics(node, root),
              },
            ];
          }),
      );
    }
    case 'io_calls_count':
    case 'io_read_calls_count':
    case 'io_write_calls_count': {
      const mode =
        rule === 'io_calls_count'
          ? 'all'
          : rule === 'io_read_calls_count'
            ? 'read'
            : 'write';
      const counts = (method: boolean) =>
        Object.fromEntries(
          rustFunctions(root)
            .filter((node) => isRustMethod(node) === method)
            .map((node) => [symbolKey(node), rustIo(node, root)[mode]]),
        );
      return { functions: counts(false), methods: counts(true) };
    }
    default:
      throw new Error(`Unsupported Rust rule: ${rule}`);
  }
};
