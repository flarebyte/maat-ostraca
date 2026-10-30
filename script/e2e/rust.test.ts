import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolveRules } from '../../src/rules/resolve.js';
import * as cli from './helpers.js';

const fixture = 'testdata/rust/regression';
const cases = {
  imports: 'import_files_list,package_imports_list',
  symbols: 'function_map,method_map',
  traits: 'interface_map,interfaces_code_map',
  metrics: 'file_metrics,code_hash',
  io: 'io_calls_count,io_read_calls_count,io_write_calls_count',
  messages: 'exception_messages_list,error_messages_list',
  env: 'env_names_list',
  tests: 'testcase_titles_list',
  all: '*',
};
for (const [family, rules] of Object.entries(cases)) {
  test(`Rust ${family} analyse golden, schema and repeated bytes`, () =>
    cli.expectRepeatedAnalyseGolden(
      [
        'analyse',
        '--language',
        'rust',
        '--in',
        `${fixture}/v1.rs`,
        '--rules',
        rules,
        '--json',
      ],
      `${fixture}/${family}-analyse.golden.json`,
    ));
  test(`Rust ${family} diff golden, schema and repeated bytes`, () =>
    cli.expectRepeatedDiffGolden(
      [
        'diff',
        '--language',
        'rust',
        '--from',
        `${fixture}/v1.rs`,
        '--to',
        `${fixture}/v2.rs`,
        '--rules',
        rules,
        '--json',
      ],
      `${fixture}/${family}-diff.golden.json`,
    ));
}
const analyseArgs = ['analyse', '--language', 'rust', '--json', '--rules', '*'];
test('Rust file and stdin rules agree, including CRLF and Unicode input', () => {
  const source = readFileSync(`${fixture}/v1.rs`);
  const fromFile = cli.parseAnalyseOutput(
    cli.expectSuccess(cli.runCli([...analyseArgs, '--in', `${fixture}/v1.rs`])),
  );
  const fromStdin = cli.parseAnalyseOutput(
    cli.expectSuccess(cli.runCli(analyseArgs, source)),
  );
  expect(fromFile.rules).toEqual(fromStdin.rules);
  expect(fromStdin.filename).toBeUndefined();
  const unicode = 'fn café() { println!("你好"); }\r\n';
  const pair = cli.runTwice(analyseArgs, unicode);
  expect(
    cli.equalBytes(
      cli.expectSuccess(pair.first),
      cli.expectSuccess(pair.second),
    ),
  ).toBeTrue();
  expect(
    cli.parseAnalyseOutput(pair.first.stdout).rules.function_map,
  ).toHaveProperty('café');
});
test('Rust selectors and manifest expose exactly the implemented rules', () => {
  const manifest = cli.parseRulesListOutput(
    cli.expectSuccess(cli.runCli(['rules', '--language', 'rust', '--json'])),
  );
  const explicit = resolveRules({ language: 'rust', rules: '*' });
  expect(manifest.rules.map((rule) => rule.name).sort()).toEqual(explicit);
  const args = [
    'analyse',
    '--in',
    `${fixture}/v1.rs`,
    '--language',
    'rust',
    '--json',
    '--rules',
  ];
  const wildcard = cli.expectSuccess(cli.runCli([...args, '*']));
  for (const rules of [explicit.join(','), explicit.toReversed().join(',')])
    expect(
      cli.equalBytes(wildcard, cli.expectSuccess(cli.runCli([...args, rules]))),
    ).toBeTrue();
  const prefix = cli.parseAnalyseOutput(
    cli.expectSuccess(cli.runCli([...args, 'io_*'])),
  );
  expect(Object.keys(prefix.rules)).toEqual([
    'io_calls_count',
    'io_read_calls_count',
    'io_write_calls_count',
  ]);
});
for (const rule of [
  'class_map',
  'import_functions_list',
  'import_types_list',
  'unknown_rule',
])
  test(`Rust unsupported selection has stable usage envelope: ${rule}`, () => {
    const { first, second } = cli.runTwice([
      'analyse',
      '--language',
      'rust',
      '--in',
      `${fixture}/v1.rs`,
      '--rules',
      rule,
      '--json',
    ]);
    expect(first.exitCode).toBe(2);
    expect(second.exitCode).toBe(2);
    expect(first.stderr.length).toBe(0);
    expect(cli.equalBytes(first.stdout, second.stdout)).toBeTrue();
    expect(cli.parseJsonErrorOutput(first.stdout).error.code).toBe('E_USAGE');
  });
for (const changed of [false, true])
  test(`Rust delta-only and exit-code-on-change handle ${changed ? 'changed' : 'identical'} inputs`, () => {
    const args = [
      'diff',
      '--language',
      'rust',
      '--from',
      `${fixture}/v1.rs`,
      '--to',
      `${fixture}/${changed ? 'v2' : 'v1'}.rs`,
      '--rules',
      '*',
      '--json',
      '--delta-only',
    ];
    const baseline = cli.runCli(args);
    cli.expectSuccess(baseline);
    const pair = cli.runTwice([...args, '--exit-code-on-change']);
    expect(pair.first.exitCode).toBe(changed ? 3 : 0);
    expect(cli.equalBytes(pair.first.stdout, baseline.stdout)).toBeTrue();
    expect(cli.equalBytes(pair.first.stdout, pair.second.stdout)).toBeTrue();
    const parsed = cli.parseDiffOutput(pair.first.stdout);
    expect(parsed.deltaOnly).toBeTrue();
    if (changed)
      expect(parsed.rules.env_names_list).toEqual({
        added: ['RELEASE_ID', 'USER'],
        removed: ['BUILD_ID', 'HOME'],
      });
  });
for (const command of ['analyse', 'diff', 'rules'])
  test(`Rust ${command} human output is stable`, () => {
    const paths =
      command === 'rules'
        ? []
        : command === 'analyse'
          ? ['--in', `${fixture}/v1.rs`, '--rules', '*']
          : [
              '--from',
              `${fixture}/v1.rs`,
              '--to',
              `${fixture}/v2.rs`,
              '--rules',
              '*',
            ];
    const pair = cli.runTwice([command, '--language', 'rust', ...paths]);
    expect(
      cli.equalBytes(
        cli.expectSuccess(pair.first),
        cli.expectSuccess(pair.second),
      ),
    ).toBeTrue();
    expect(pair.first.stdout.toString()).toContain('Language: rust');
  });
test('Rust packaged entrypoint matches source CLI', () => {
  const args = [...analyseArgs, '--in', `${fixture}/v1.rs`];
  expect(
    cli.equalBytes(
      cli.expectSuccess(cli.runBuiltCli(args)),
      cli.expectSuccess(cli.runCli(args)),
    ),
  ).toBeTrue();
});
