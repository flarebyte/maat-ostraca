import { InternalError } from '../../../core/errors/index.js';
import type { RuleRunInput } from '../../dispatch.js';
import { buildIoCountOutput, countReadWritePatternMatches } from '../common.js';
import { extractDartSymbols } from './symbols.js';

export type IoCountMode = 'all' | 'read' | 'write';

export interface IoCountOutput {
  functions: Record<string, number>;
  methods: Record<string, number>;
}

// Deterministic v1 Dart IO pattern set:
// - reads: File(...).readAsString/readAsBytes/readAsLines/openRead,
//   http.get, dio.get, and client.get
// - writes: File(...).writeAsString/writeAsBytes, stdout.write/writeln, print,
//   http.post/put/patch, dio.post/put/patch, and client.post
// Discovered symbols are always emitted with numeric counts, including zero.
const READ_PATTERNS = [
  /\bFile\s*\([\s\S]*?\)\s*\.\s*readAsString\s*\(/g,
  /\bFile\s*\([\s\S]*?\)\s*\.\s*readAsBytes\s*\(/g,
  /\bFile\s*\([\s\S]*?\)\s*\.\s*readAsLines\s*\(/g,
  /\bFile\s*\([\s\S]*?\)\s*\.\s*openRead\s*\(/g,
  /\bhttp\.get\s*\(/g,
  /\bdio\.get\s*\(/g,
  /\bclient\.get\s*\(/g,
];

const WRITE_PATTERNS = [
  /\bFile\s*\([\s\S]*?\)\s*\.\s*writeAsString\s*\(/g,
  /\bFile\s*\([\s\S]*?\)\s*\.\s*writeAsBytes\s*\(/g,
  /\bstdout\.write(?:ln)?\s*\(/g,
  /\bprint\s*\(/g,
  /\bhttp\.(?:post|put|patch)\s*\(/g,
  /\bdio\.(?:post|put|patch)\s*\(/g,
  /\bclient\.post\s*\(/g,
];

const countInBody = (bodySource: string, mode: IoCountMode): number => {
  return countReadWritePatternMatches(
    bodySource,
    mode,
    READ_PATTERNS,
    WRITE_PATTERNS,
  );
};

export const countDartIoBySymbol = (
  input: RuleRunInput,
  mode: IoCountMode,
): IoCountOutput => {
  if (input.language !== 'dart') {
    throw new InternalError(
      `io_count_error: unsupported language "${input.language}"`,
    );
  }

  try {
    const symbols = extractDartSymbols(input);

    return buildIoCountOutput(
      {
        functions: symbols.functions.map((symbol) => ({
          key: symbol.name,
          bodySource: symbol.bodySource,
        })),
        methods: symbols.methods.map((symbol) => ({
          key: symbol.key,
          bodySource: symbol.bodySource,
        })),
      },
      (bodySource) => countInBody(bodySource, mode),
    );
  } catch (error: unknown) {
    if (error instanceof InternalError) {
      throw error;
    }

    throw new InternalError('io_count_error: failed to compute io counts');
  }
};
