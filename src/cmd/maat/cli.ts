import {
  Command,
  CommanderError,
  InvalidArgumentError,
  Option,
} from 'commander';
import type { JsonErrorOutput } from '../../core/contracts/outputs.js';
import { formatOutput } from '../../core/format/output.js';
import {
  type AnalyseOutput,
  canonicalStringify,
  type DiffOutput,
  diffResults,
  formatError,
  InternalError,
  type Language,
  type OutputKind,
  type RulesListOutput,
  runAnalyse,
  runRulesList,
  SUPPORTED_LANGUAGES,
  UsageError,
  validateOutputOrThrow,
} from '../../core/index.js';
import { resolveSource } from '../../core/source/resolve.js';
import { resolveDiffSource } from '../../core/source/resolve-diff.js';
import { resolveRules } from '../../rules/index.js';

export interface CliIo {
  stdout: (message: string) => void;
  stderr: (message: string) => void;
}

interface CliDeps {
  runAnalyse: typeof runAnalyse;
  runRulesList: typeof runRulesList;
  resolveRules: typeof resolveRules;
  resolveSource: typeof resolveSource;
  resolveDiffSource: typeof resolveDiffSource;
}

const defaultDeps: CliDeps = {
  runAnalyse,
  runRulesList,
  resolveRules,
  resolveSource,
  resolveDiffSource,
};

const parseLanguage = (value: string): Language => {
  if (SUPPORTED_LANGUAGES.includes(value as Language)) {
    return value as Language;
  }

  throw new InvalidArgumentError(
    'language must be one of: go, typescript, dart',
  );
};

const parseRulesCsv = (value: string): string => {
  if (value.trim().length === 0) {
    throw new InvalidArgumentError('rules must be a non-empty csv string');
  }

  return value;
};

const writeResult = (
  kind: OutputKind,
  json: boolean,
  result: AnalyseOutput | DiffOutput | RulesListOutput,
  io: CliIo,
): void => {
  const runtimeProcess = globalThis as typeof globalThis & {
    process?: {
      env?: Record<string, string | undefined>;
      stdout?: { isTTY?: boolean };
    };
  };

  validateOutputOrThrow(kind, result);
  io.stdout(
    formatOutput(kind, result, json, {
      env: runtimeProcess.process?.env,
      isTTY: runtimeProcess.process?.stdout?.isTTY ?? false,
    }),
  );
};

const normalizeError = (error: unknown): unknown => {
  if (error instanceof UsageError) {
    return error;
  }

  if (error instanceof CommanderError) {
    return new UsageError(error.message);
  }

  return error;
};

const fallbackInternalJsonError: JsonErrorOutput = {
  error: {
    code: 'E_INTERNAL',
    message: 'internal error',
  },
};

export const createProgram = (
  io: CliIo,
  deps: CliDeps = defaultDeps,
): Command => {
  const program = new Command();
  program
    .name('maat')
    .description('Analyse source snapshots and diffs with deterministic output')
    .showHelpAfterError(false)
    .configureOutput({
      writeOut: (message) => {
        io.stdout(message);
      },
      writeErr: () => {},
      outputError: () => {},
    })
    .exitOverride();

  program
    .command('analyse')
    .description(
      'Analyse one source snapshot from --in or, when omitted, from stdin',
    )
    .requiredOption(
      '--rules <csv>',
      'Required. Comma-separated rule identifiers',
      parseRulesCsv,
    )
    .addOption(
      new Option(
        '--language <typescript|go|dart>',
        'Required. Source language: typescript, go, dart',
      )
        .argParser(parseLanguage)
        .makeOptionMandatory(true),
    )
    .option(
      '--in <path>',
      'Optional. Input file path. If omitted, read source from stdin',
    )
    .option('--json', 'Optional. Emit canonical JSON output')
    .action(
      async (options: {
        in?: string;
        rules: string;
        language: Language;
        json?: boolean;
      }) => {
        const resolvedRules = deps.resolveRules({
          rules: options.rules,
          language: options.language,
        });
        const source = await deps.resolveSource({
          language: options.language,
          ...(options.in ? { inPath: options.in } : {}),
        });
        const analyseArgs = {
          source: source.source,
          language: options.language,
          rules: resolvedRules,
          ...(source.filename ? { filename: source.filename } : {}),
        };
        const result = await deps.runAnalyse({
          ...analyseArgs,
        });
        writeResult('analyse', Boolean(options.json), result, io);
      },
    );

  program
    .command('diff')
    .description(
      'Diff two source snapshots from --from and --to or, when --to is omitted, from stdin',
    )
    .requiredOption('--from <path>', 'Required. Baseline source path')
    .option(
      '--to <path>',
      'Optional. Target source path. If omitted, read target source from stdin',
    )
    .requiredOption(
      '--rules <csv>',
      'Required. Comma-separated rule identifiers',
      parseRulesCsv,
    )
    .addOption(
      new Option(
        '--language <typescript|go|dart>',
        'Required. Source language: typescript, go, dart',
      )
        .argParser(parseLanguage)
        .makeOptionMandatory(true),
    )
    .option('--json', 'Optional. Emit canonical JSON output')
    .option(
      '--delta-only',
      'Optional. Emit delta-only JSON output. Requires --json',
    )
    .action(
      async (options: {
        from: string;
        to?: string;
        rules: string;
        language: Language;
        json?: boolean;
        deltaOnly?: boolean;
      }) => {
        if (options.deltaOnly && !options.json) {
          throw new UsageError('--delta-only requires --json');
        }

        const resolvedRules = deps.resolveRules({
          rules: options.rules,
          language: options.language,
        });
        const source = await deps.resolveDiffSource({
          fromPath: options.from,
          language: options.language,
          ...(options.to ? { toPath: options.to } : {}),
        });
        const diffArgs = {
          fromFilename: source.fromFilename,
          fromSource: source.fromSource,
          toSource: source.toSource,
          language: options.language,
          rules: resolvedRules,
          ...(source.toFilename ? { toFilename: source.toFilename } : {}),
          ...(options.deltaOnly ? { deltaOnly: true as const } : {}),
        };
        const fromSnapshot = await deps.runAnalyse({
          filename: diffArgs.fromFilename,
          source: diffArgs.fromSource,
          language: diffArgs.language,
          rules: diffArgs.rules,
        });
        const toSnapshot = await deps.runAnalyse({
          ...(diffArgs.toFilename ? { filename: diffArgs.toFilename } : {}),
          source: diffArgs.toSource,
          language: diffArgs.language,
          rules: diffArgs.rules,
        });
        const result = diffResults(fromSnapshot, toSnapshot, {
          deltaOnly: Boolean(diffArgs.deltaOnly),
        });
        writeResult('diff', Boolean(options.json), result, io);
      },
    );

  program
    .command('rules')
    .description('List available rules for one supported language')
    .addOption(
      new Option(
        '--language <typescript|go|dart>',
        'Required. Source language: typescript, go, dart',
      )
        .argParser(parseLanguage)
        .makeOptionMandatory(true),
    )
    .option('--json', 'Optional. Emit canonical JSON output')
    .action(async (options: { language: Language; json?: boolean }) => {
      const result = await deps.runRulesList({ language: options.language });
      writeResult('rules', Boolean(options.json), result, io);
    });

  return program;
};

export const runCli = async (
  argv: string[],
  io: CliIo = {
    stdout: (message) => {
      process.stdout.write(message);
    },
    stderr: (message) => {
      process.stderr.write(message);
    },
  },
  deps: CliDeps = defaultDeps,
): Promise<number> => {
  const program = createProgram(io, deps);
  const jsonOutput = argv.includes('--json');

  // Error behavior contract:
  // - exit codes: UsageError => 2, InternalError/unknown => 1
  // - success routing: stdout only
  // - error routing: --json => stdout JSON envelope only, non-json => stderr line only
  // - unknown/non-Error throws are normalized to deterministic InternalError
  try {
    await program.parseAsync(argv, { from: 'user' });
    return 0;
  } catch (error) {
    if (
      error instanceof CommanderError &&
      error.code === 'commander.helpDisplayed'
    ) {
      return 0;
    }

    const normalized = normalizeError(error);
    const normalizedError =
      normalized instanceof Error
        ? normalized
        : new InternalError('internal error');
    const formatted = formatError(normalizedError, { json: jsonOutput });

    if (formatted.jsonOutput) {
      try {
        validateOutputOrThrow('error', formatted.jsonOutput);
        io.stdout(`${canonicalStringify(formatted.jsonOutput)}\n`);
        return formatted.exitCode;
      } catch {
        io.stdout(`${canonicalStringify(fallbackInternalJsonError)}\n`);
        return 1;
      }
    }

    if (formatted.stderr) {
      io.stderr(formatted.stderr);
    }

    return formatted.exitCode;
  }
};
