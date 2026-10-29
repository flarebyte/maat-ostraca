import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolveRules } from '../../src/rules/resolve.js';
import {
  equalBytes,
  expectRepeatedAnalyseGolden,
  expectRepeatedDiffGolden,
  expectSuccess,
  parseAnalyseOutput,
  parseDiffOutput,
  parseJsonErrorOutput,
  parseRulesListOutput,
  runBuiltCli,
  runCli,
  runTwice,
} from './helpers.js';

const folder = 'testdata/python/regression';
const families = {
  imports: 'import_files_list,package_imports_list',
  symbols: 'function_map,method_map,class_map',
  metrics: 'file_metrics,code_hash',
  io: 'io_calls_count,io_read_calls_count,io_write_calls_count',
  messages: 'exception_messages_list,error_messages_list',
  env: 'env_names_list',
  tests: 'testcase_titles_list',
  all: '*',
};
for (const [family, rules] of Object.entries(families)) {
  test(`Python ${family} analyse schema, golden and repeated bytes`, () => {
    expectRepeatedAnalyseGolden(
      [
        'analyse',
        '--in',
        `${folder}/v1.py`,
        '--language',
        'python',
        '--rules',
        rules,
        '--json',
      ],
      `${folder}/${family}-analyse.golden.json`,
    );
  });
  test(`Python ${family} diff schema, golden and repeated bytes`, () => {
    expectRepeatedDiffGolden(
      [
        'diff',
        '--from',
        `${folder}/v1.py`,
        '--to',
        `${folder}/v2.py`,
        '--language',
        'python',
        '--rules',
        rules,
        '--json',
      ],
      `${folder}/${family}-diff.golden.json`,
    );
  });
}
test('Python stdin and file inputs produce identical rules', () => {
  const input = readFileSync(`${folder}/v1.py`);
  const args = ['analyse', '--language', 'python', '--rules', '*', '--json'];
  const stdin = parseAnalyseOutput(expectSuccess(runCli(args, input)));
  const file = parseAnalyseOutput(
    expectSuccess(runCli([...args, '--in', `${folder}/v1.py`])),
  );
  expect(stdin.rules).toEqual(file.rules);
  expect(stdin.filename).toBeUndefined();
});
test('Python wildcard, explicit and reordered selectors agree', () => {
  const args = [
    'analyse',
    '--in',
    `${folder}/v1.py`,
    '--language',
    'python',
    '--json',
    '--rules',
  ];
  const names = resolveRules({ language: 'python', rules: '*' });
  const all = expectSuccess(runCli([...args, '*']));
  expect(
    equalBytes(all, expectSuccess(runCli([...args, names.join(',')]))),
  ).toBeTrue();
  expect(
    equalBytes(
      all,
      expectSuccess(runCli([...args, names.reverse().join(',')])),
    ),
  ).toBeTrue();
});
test('Python rule manifest matches implemented wildcard rules', () => {
  const output = parseRulesListOutput(
    expectSuccess(runCli(['rules', '--language', 'python', '--json'])),
  );
  expect(output.rules.map((rule) => rule.name).sort()).toEqual(
    resolveRules({ language: 'python', rules: '*' }),
  );
});
for (const rule of ['interface_map', 'import_types_list', 'not_a_rule'])
  test(`Python deterministic usage error: ${rule}`, () => {
    const { first, second } = runTwice([
      'analyse',
      '--in',
      `${folder}/v1.py`,
      '--language',
      'python',
      '--rules',
      rule,
      '--json',
    ]);
    expect(first.exitCode).toBe(2);
    expect(equalBytes(first.stdout, second.stdout)).toBeTrue();
    expect(parseJsonErrorOutput(first.stdout).error.code).toBe('E_USAGE');
  });
for (const same of [true, false])
  test(`Python delta-only ${same ? 'unchanged' : 'changed'} snapshots`, () => {
    const result = runCli([
      'diff',
      '--from',
      `${folder}/v1.py`,
      '--to',
      `${folder}/${same ? 'v1' : 'v2'}.py`,
      '--language',
      'python',
      '--rules',
      '*',
      '--delta-only',
      '--json',
    ]);
    expect(parseDiffOutput(expectSuccess(result)).deltaOnly).toBeTrue();
  });
for (const command of ['analyse', 'diff'])
  test(`Python ${command} human output repeats deterministically`, () => {
    const paths =
      command === 'analyse'
        ? ['--in', `${folder}/v1.py`]
        : ['--from', `${folder}/v1.py`, '--to', `${folder}/v2.py`];
    const { first, second } = runTwice([
      command,
      ...paths,
      '--language',
      'python',
      '--rules',
      '*',
    ]);
    expect(equalBytes(expectSuccess(first), expectSuccess(second))).toBeTrue();
    expect(first.stdout.toString()).toContain('python');
  });
test('Python packaged CLI matches source CLI', () => {
  const args = [
    'analyse',
    '--in',
    `${folder}/v1.py`,
    '--language',
    'python',
    '--rules',
    '*',
    '--json',
  ];
  expect(
    equalBytes(expectSuccess(runBuiltCli(args)), expectSuccess(runCli(args))),
  ).toBeTrue();
});
