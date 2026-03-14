import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';
import {
  DiffOutputSchema,
  JsonErrorOutputSchema,
  RulesListOutputSchema,
} from '../src/core/contracts/schemas.js';

const runCli = (args: string[], input?: string) => {
  return spawnSync(
    process.execPath,
    ['--import', 'tsx', 'src/cmd/maat/index.ts', ...args],
    {
      encoding: 'utf8',
      ...(input !== undefined ? { input } : {}),
    },
  );
};

describe('maat cli parsing', () => {
  it('root help exits 0 and documents supported commands deterministically', () => {
    const first = runCli(['--help']);
    const second = runCli(['--help']);

    assert.equal(first.status, 0);
    assert.equal(second.status, 0);
    assert.equal(first.stderr, '');
    assert.equal(second.stderr, '');
    assert.equal(first.stdout, second.stdout);
    assert.match(first.stdout, /Usage: maat/);
    assert.match(first.stdout, /analyse/);
    assert.match(first.stdout, /diff/);
    assert.match(first.stdout, /rules/);
  });

  it('analyse help exits 0 and documents stdin, json, and languages', () => {
    const first = runCli(['analyse', '--help']);
    const second = runCli(['analyse', '--help']);

    assert.equal(first.status, 0);
    assert.equal(second.status, 0);
    assert.equal(first.stderr, '');
    assert.equal(second.stderr, '');
    assert.equal(first.stdout, second.stdout);
    assert.match(first.stdout, /Required\. Comma-separated rule identifiers/);
    assert.match(first.stdout, /If omitted,/);
    assert.match(first.stdout, /source from stdin/);
    assert.match(first.stdout, /Optional\. Emit canonical JSON output/);
    assert.match(first.stdout, /typescript, go,/);
    assert.match(first.stdout, /dart/);
  });

  it('diff help exits 0 and documents stdin, json, delta-only, and languages', () => {
    const first = runCli(['diff', '--help']);
    const second = runCli(['diff', '--help']);

    assert.equal(first.status, 0);
    assert.equal(second.status, 0);
    assert.equal(first.stderr, '');
    assert.equal(second.stderr, '');
    assert.equal(first.stdout, second.stdout);
    assert.match(first.stdout, /If omitted,/);
    assert.match(first.stdout, /read target source from stdin/);
    assert.match(first.stdout, /Optional\. Emit canonical JSON output/);
    assert.match(first.stdout, /Optional\. Emit delta-only JSON output\./);
    assert.match(first.stdout, /Requires --json/);
    assert.match(first.stdout, /typescript, go,/);
    assert.match(first.stdout, /dart/);
  });

  it('rules help exits 0 and documents json and languages', () => {
    const first = runCli(['rules', '--help']);
    const second = runCli(['rules', '--help']);

    assert.equal(first.status, 0);
    assert.equal(second.status, 0);
    assert.equal(first.stderr, '');
    assert.equal(second.stderr, '');
    assert.equal(first.stdout, second.stdout);
    assert.match(
      first.stdout,
      /List available rules for one supported language/,
    );
    assert.match(first.stdout, /Optional\. Emit canonical JSON output/);
    assert.match(first.stdout, /typescript, go,/);
    assert.match(first.stdout, /dart/);
  });

  it('returns exit code 2 when required flags are missing', () => {
    const result = runCli(['analyse', '--language', 'go']);

    assert.equal(result.status, 2);
    assert.equal(
      result.stderr,
      "error: required option '--rules <csv>' not specified\n",
    );
  });

  it('returns exit code 2 when --delta-only is used without --json', () => {
    const result = runCli([
      'diff',
      '--from',
      'a.ts',
      '--rules',
      'code_hash',
      '--language',
      'typescript',
      '--delta-only',
    ]);

    assert.equal(result.status, 2);
    assert.equal(result.stderr, '--delta-only requires --json\n');
  });

  it('unknown rule with --json prints JSON error envelope to stdout and exits 2', () => {
    const result = runCli(
      [
        'analyse',
        '--rules',
        'unknown_rule',
        '--language',
        'typescript',
        '--json',
      ],
      'const a = 1;\n',
    );

    assert.equal(result.status, 2);
    assert.equal(result.stderr, '');

    const payload = JSON.parse(result.stdout) as unknown;
    const parsed = JsonErrorOutputSchema.safeParse(payload);
    assert.equal(parsed.success, true);
    assert.equal(
      result.stdout,
      '{"error":{"code":"E_USAGE","message":"unknown rule \\"unknown_rule\\" for language \\"typescript\\""}}\n',
    );
  });

  it('unknown rule without --json prints deterministic stderr and exits 2', () => {
    const result = runCli(
      ['analyse', '--rules', 'unknown_rule', '--language', 'typescript'],
      'const a = 1;\n',
    );

    assert.equal(result.status, 2);
    assert.equal(result.stdout, '');
    assert.equal(
      result.stderr,
      'unknown rule "unknown_rule" for language "typescript"\n',
    );
  });

  it('returns sorted rules list for language in json mode and matches schema', () => {
    const result = runCli(['rules', '--language', 'typescript', '--json']);

    assert.equal(result.status, 0);

    const payload = JSON.parse(result.stdout) as unknown;
    const parsed = RulesListOutputSchema.safeParse(payload);
    assert.equal(parsed.success, true);
    if (!parsed.success) {
      return;
    }

    const names = parsed.data.rules.map((rule) => rule.name);
    const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
    assert.deepEqual(names, sortedNames);
    assert.ok(names.includes('import_files_list'));
  });

  it('analyse json includes deterministic outputs for implemented rules', () => {
    const result = runCli(
      [
        'analyse',
        '--rules',
        'import_files_list,file_metrics,code_hash',
        '--language',
        'typescript',
        '--json',
      ],
      'const a = 1;\r\n',
    );

    assert.equal(result.status, 0);
    const payload = JSON.parse(result.stdout) as {
      language: string;
      rules: Record<string, unknown>;
    };

    assert.equal(payload.language, 'typescript');
    assert.deepEqual(Object.keys(payload.rules), [
      'code_hash',
      'file_metrics',
      'import_files_list',
    ]);
    assert.equal(
      result.stdout,
      '{"language":"typescript","rules":{"code_hash":{"algorithm":"sha256","file":"b79b14bd2584dd52b0f0ef042a2a4f104cda48330500e12237737cc51fbda43d"},"file_metrics":{"cognitiveComplexity":1,"conditions":0,"cyclomaticComplexity":1,"loc":2,"loops":0,"maxNestingDepth":0,"sloc":1,"tokens":5},"import_files_list":[]}}\n',
    );
  });

  it('diff json output matches DiffOutputSchema', () => {
    const result = runCli(
      [
        'diff',
        '--from',
        'testdata/diff-from.ts',
        '--rules',
        'import_files_list,file_metrics,code_hash',
        '--language',
        'typescript',
        '--json',
      ],
      'export const value = 2;\n',
    );

    assert.equal(result.status, 0);
    const payload = JSON.parse(result.stdout) as unknown;
    const parsed = DiffOutputSchema.safeParse(payload);
    assert.equal(parsed.success, true);
  });

  it('diff json delta-only output includes top-level deltaOnly true', () => {
    const result = runCli(
      [
        'diff',
        '--from',
        'testdata/diff-from.ts',
        '--rules',
        'import_files_list,file_metrics,code_hash',
        '--language',
        'typescript',
        '--json',
        '--delta-only',
      ],
      'export const value = 2;\n',
    );

    assert.equal(result.status, 0);
    const payload = JSON.parse(result.stdout) as { deltaOnly?: boolean };
    assert.equal(payload.deltaOnly, true);
  });

  it('json success output is byte-identical across runs', () => {
    const first = runCli(
      [
        'analyse',
        '--rules',
        'import_files_list,file_metrics,code_hash',
        '--language',
        'typescript',
        '--json',
      ],
      'const a = 1;\r\n',
    );
    const second = runCli(
      [
        'analyse',
        '--rules',
        'import_files_list,file_metrics,code_hash',
        '--language',
        'typescript',
        '--json',
      ],
      'const a = 1;\r\n',
    );

    assert.equal(first.status, 0);
    assert.equal(second.status, 0);
    assert.equal(first.stdout, second.stdout);
  });

  it('json error output is byte-identical across runs', () => {
    const first = runCli(
      [
        'analyse',
        '--rules',
        'unknown_rule',
        '--language',
        'typescript',
        '--json',
      ],
      'const a = 1;\n',
    );
    const second = runCli(
      [
        'analyse',
        '--rules',
        'unknown_rule',
        '--language',
        'typescript',
        '--json',
      ],
      'const a = 1;\n',
    );

    assert.equal(first.status, 2);
    assert.equal(second.status, 2);
    assert.equal(first.stdout, second.stdout);
  });

  it('diff json success output is byte-identical across runs', () => {
    const args = [
      'diff',
      '--from',
      'testdata/diff-from.ts',
      '--rules',
      'import_files_list,file_metrics,code_hash',
      '--language',
      'typescript',
      '--json',
    ];
    const first = runCli(args, 'export const value = 2;\n');
    const second = runCli(args, 'export const value = 2;\n');

    assert.equal(first.status, 0);
    assert.equal(second.status, 0);
    assert.equal(first.stdout, second.stdout);
  });
});
