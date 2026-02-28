import {
  Command,
  CommanderError,
  InvalidArgumentError,
  Option,
} from 'commander';
import {
  canonicalStringify,
  type Language,
  runAnalyse,
  runDiff,
  runRulesList,
  SUPPORTED_LANGUAGES,
} from '../../core/index.js';
import {
  resolveSource,
  SourceResolutionError,
} from '../../core/source/resolve.js';
import { resolveDiffSource } from '../../core/source/resolve-diff.js';
import { RuleResolutionError, resolveRules } from '../../rules/index.js';

export interface CliIo {
  stdout: (message: string) => void;
  stderr: (message: string) => void;
}

export class UsageError extends Error {}

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
  commandName: string,
  json: boolean,
  result: object,
  io: CliIo,
): void => {
  if (json) {
    io.stdout(`${canonicalStringify(result)}\n`);
    return;
  }

  io.stdout(`${commandName}: ok\n`);
};

export const createProgram = (io: CliIo): Command => {
  const program = new Command();
  program
    .name('maat')
    .description('MAAT CLI walking skeleton')
    .showHelpAfterError(false)
    .configureOutput({
      writeOut: () => {},
      writeErr: () => {},
      outputError: () => {},
    })
    .exitOverride();

  program
    .command('analyse')
    .requiredOption(
      '--rules <csv>',
      'Comma-separated rule identifiers',
      parseRulesCsv,
    )
    .addOption(
      new Option('--language <go|typescript|dart>', 'Language for analysis')
        .argParser(parseLanguage)
        .makeOptionMandatory(true),
    )
    .option('--in <path>', 'Input file path. If omitted, stdin is used')
    .option('--json', 'Print JSON output')
    .action(
      async (options: {
        in?: string;
        rules: string;
        language: Language;
        json?: boolean;
      }) => {
        const resolvedRules = resolveRules({
          rules: options.rules,
          language: options.language,
        });
        const source = await resolveSource({
          language: options.language,
          ...(options.in ? { inPath: options.in } : {}),
        });
        const analyseArgs = {
          source: source.source,
          language: options.language,
          rules: resolvedRules,
          ...(source.filename ? { filename: source.filename } : {}),
        };
        const result = await runAnalyse({
          ...analyseArgs,
        });
        writeResult('analyse', Boolean(options.json), result, io);
      },
    );

  program
    .command('diff')
    .requiredOption('--from <path>', 'Source baseline path')
    .option('--to <path>', 'Target path. If omitted, stdin is used')
    .requiredOption(
      '--rules <csv>',
      'Comma-separated rule identifiers',
      parseRulesCsv,
    )
    .addOption(
      new Option('--language <go|typescript|dart>', 'Language for diff')
        .argParser(parseLanguage)
        .makeOptionMandatory(true),
    )
    .option('--json', 'Print JSON output')
    .option('--delta-only', 'Output delta only (requires --json)')
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

        const resolvedRules = resolveRules({
          rules: options.rules,
          language: options.language,
        });
        const source = await resolveDiffSource({
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
        const result = await runDiff({
          ...diffArgs,
        });
        writeResult('diff', Boolean(options.json), result, io);
      },
    );

  program
    .command('rules')
    .addOption(
      new Option('--language <go|typescript|dart>', 'Language for rule listing')
        .argParser(parseLanguage)
        .makeOptionMandatory(true),
    )
    .option('--json', 'Print JSON output')
    .action(async (options: { language: Language; json?: boolean }) => {
      const result = await runRulesList({ language: options.language });
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
): Promise<number> => {
  const program = createProgram(io);

  try {
    await program.parseAsync(argv, { from: 'user' });
    return 0;
  } catch (error) {
    if (error instanceof UsageError) {
      io.stderr(`usage error: ${error.message}\n`);
      return 2;
    }

    if (error instanceof RuleResolutionError) {
      io.stderr(`usage error: ${error.message}\n`);
      return 2;
    }

    if (error instanceof SourceResolutionError) {
      io.stderr(`usage error: ${error.message}\n`);
      return 2;
    }

    if (error instanceof CommanderError) {
      io.stderr(`usage error: ${error.message}\n`);
      return 2;
    }

    io.stderr('internal error\n');
    return 1;
  }
};
