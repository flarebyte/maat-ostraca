import { InternalError } from '../../../core/errors/index.js';
import type { RuleRunInput } from '../../dispatch.js';
import { buildIoCountOutput, countReadWritePatternMatches } from '../common.js';
import { extractGoSymbols } from './symbols.js';

export type IoCountMode = 'all' | 'read' | 'write';

export interface IoCountOutput {
  functions: Record<string, number>;
  methods: Record<string, number>;
}

// Deterministic v1 Go IO pattern set:
// - reads: os.ReadFile, io.ReadAll, http.Get, and selector calls ending in Read
// - writes: os.WriteFile, fmt.Print/Printf/Println, log.Print/Printf/Println,
//   http.Post, and selector calls ending in Write
// Discovered symbols are always emitted with numeric counts, including zero.
const READ_PATTERNS = [
  /\bos\.ReadFile\s*\(/g,
  /\bio\.ReadAll\s*\(/g,
  /\bhttp\.Get\s*\(/g,
  /\b[A-Za-z_][A-Za-z0-9_.]*\.Read\s*\(/g,
];

const WRITE_PATTERNS = [
  /\bos\.WriteFile\s*\(/g,
  /\bfmt\.Print(?:f|ln)?\s*\(/g,
  /\blog\.Print(?:f|ln)?\s*\(/g,
  /\bhttp\.Post\s*\(/g,
  /\b[A-Za-z_][A-Za-z0-9_.]*\.Write\s*\(/g,
];

const countInBody = (bodySource: string, mode: IoCountMode): number => {
  return countReadWritePatternMatches(
    bodySource,
    mode,
    READ_PATTERNS,
    WRITE_PATTERNS,
  );
};

export const countGoIoBySymbol = (
  input: RuleRunInput,
  mode: IoCountMode,
): IoCountOutput => {
  if (input.language !== 'go') {
    throw new InternalError(
      `io_count_error: unsupported language "${input.language}"`,
    );
  }

  try {
    const symbols = extractGoSymbols(input);

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
