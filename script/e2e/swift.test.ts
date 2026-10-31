import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import * as cli from './helpers.js';

const root = 'testdata/swift/regression';
const groups: Record<string, string> = {
  imports: 'import_files_list,package_imports_list',
  symbols: 'function_map,method_map,class_map',
  protocols: 'interface_map,interfaces_code_map',
  metrics: 'file_metrics,code_hash',
  io: 'io_calls_count,io_read_calls_count,io_write_calls_count',
  messages: 'exception_messages_list,error_messages_list',
  environment: 'env_names_list',
  tests: 'testcase_titles_list',
  all: '*',
};
for (const [group, selector] of Object.entries(groups))
  for (const command of ['analyse', 'diff'])
    test(`Swift ${group} ${command}: schema, golden and stable bytes`, () => {
      const source =
        command === 'analyse'
          ? ['--in', `${root}/v1.swift`]
          : ['--from', `${root}/v1.swift`, '--to', `${root}/v2.swift`];
      const args = [
        command,
        ...source,
        '--language',
        'swift',
        '--rules',
        selector,
        '--json',
      ];
      const golden = `${root}/${group}-${command}.golden.json`;
      if (command === 'analyse') cli.expectRepeatedAnalyseGolden(args, golden);
      else cli.expectRepeatedDiffGolden(args, golden);
    });
const analyse = ['analyse', '--language', 'swift', '--rules', '*', '--json'];
test('Swift stdin rules match file input and preserve Unicode symbols', () => {
  const source = cli.parseAnalyseOutput(
    cli.expectSuccess(cli.runCli(analyse, readFileSync(`${root}/v1.swift`))),
  );
  const file = cli.parseAnalyseOutput(
    cli.expectSuccess(cli.runCli([...analyse, '--in', `${root}/v1.swift`])),
  );
  expect(source.rules).toEqual(file.rules);
  expect(source.filename).toBeUndefined();
  const unicode = cli.parseAnalyseOutput(
    cli.expectSuccess(cli.runCli(analyse, 'func café() { print("你好") }\r\n')),
  );
  expect(unicode.rules.function_map).toHaveProperty('café()');
});
test('Swift diff target from stdin matches explicit file', () => {
  const args = [
    'diff',
    '--from',
    `${root}/v1.swift`,
    '--language',
    'swift',
    '--rules',
    '*',
    '--json',
  ];
  const stdin = cli.parseDiffOutput(
    cli.expectSuccess(cli.runCli(args, readFileSync(`${root}/v2.swift`))),
  );
  const file = cli.parseDiffOutput(
    cli.expectSuccess(cli.runCli([...args, '--to', `${root}/v2.swift`])),
  );
  expect(stdin.rules).toEqual(file.rules);
});
for (const changed of [false, true])
  test(`Swift change exit code and delta-only contract: ${changed}`, () => {
    const args = [
      'diff',
      '--from',
      `${root}/v1.swift`,
      '--to',
      `${root}/${changed ? 'v2' : 'v1'}.swift`,
      '--language',
      'swift',
      '--rules',
      '*',
      '--json',
      '--delta-only',
    ];
    const baseline = cli.expectSuccess(cli.runCli(args));
    const flagged = cli.runTwice([...args, '--exit-code-on-change']);
    expect(flagged.first.exitCode).toBe(changed ? 3 : 0);
    expect(cli.equalBytes(flagged.first.stdout, baseline)).toBeTrue();
    expect(
      cli.equalBytes(flagged.first.stdout, flagged.second.stdout),
    ).toBeTrue();
    const parsed = cli.parseDiffOutput(baseline);
    expect(parsed.deltaOnly).toBeTrue();
    if (changed)
      expect(parsed.rules.env_names_list).toEqual({
        added: ['RELEASE_ID', 'USER'],
        removed: ['BUILD_ID', 'HOME'],
      });
  });
for (const rule of [
  'import_types_list',
  'import_functions_list',
  'unknown_rule',
])
  test(`Swift deterministic selection error: ${rule}`, () => {
    const pair = cli.runTwice([
      'analyse',
      '--language',
      'swift',
      '--rules',
      rule,
      '--json',
      '--in',
      `${root}/v1.swift`,
    ]);
    expect(pair.first.exitCode).toBe(2);
    expect(pair.first.stderr.length).toBe(0);
    expect(cli.equalBytes(pair.first.stdout, pair.second.stdout)).toBeTrue();
    expect(cli.parseJsonErrorOutput(pair.first.stdout).error.code).toBe(
      'E_USAGE',
    );
  });
for (const command of ['analyse', 'diff', 'rules'])
  test(`Swift stable human report: ${command}`, () => {
    const paths =
      command === 'rules'
        ? []
        : command === 'analyse'
          ? ['--in', `${root}/v1.swift`, '--rules', '*']
          : [
              '--from',
              `${root}/v1.swift`,
              '--to',
              `${root}/v2.swift`,
              '--rules',
              '*',
            ];
    const pair = cli.runTwice([command, ...paths, '--language', 'swift']);
    expect(
      cli.equalBytes(
        cli.expectSuccess(pair.first),
        cli.expectSuccess(pair.second),
      ),
    ).toBeTrue();
    expect(pair.first.stdout.toString()).toContain('Language: swift');
  });
test('Swift manifest filters supported rules with the common schema', () => {
  const output = cli.parseRulesListOutput(
    cli.expectSuccess(
      cli.runCli([
        'rules',
        '--language',
        'swift',
        '--match',
        'class_map,interface_map',
        '--json',
      ]),
    ),
  );
  expect(output.rules.map((rule) => rule.name)).toEqual([
    'class_map',
    'interface_map',
  ]);
});
test('Swift installed entrypoint produces the same JSON as source', () => {
  const args = [...analyse, '--in', `${root}/v1.swift`];
  expect(
    cli.equalBytes(
      cli.expectSuccess(cli.runBuiltCli(args)),
      cli.expectSuccess(cli.runCli(args)),
    ),
  ).toBeTrue();
});

test('Swift compiled CLI recovers incomplete syntax deterministically', () => {
  const args = [
    'analyse',
    '--language',
    'swift',
    '--rules',
    'function_map',
    '--json',
  ];
  const source = 'func complete() {}\nfunc incomplete(';
  const result = cli.runTwice(args, source);
  const parsed = cli.parseAnalyseOutput(cli.expectSuccess(result.first));
  expect(parsed.rules.function_map).toHaveProperty('complete()');
  expect(
    cli.equalBytes(result.first.stdout, cli.expectSuccess(result.second)),
  ).toBeTrue();
});
test('Swift literal filtering survives the full CLI pipeline', () => {
  const result = cli.parseAnalyseOutput(
    cli.expectSuccess(
      cli.runCli(
        [
          'analyse',
          '--language',
          'swift',
          '--rules',
          'env_names_list,exception_messages_list',
          '--json',
        ],
        'func f(){ getenv("HOME"); getenv("A" + value); fatalError("dynamic \\(value)"); fatalError("static") }',
      ),
    ),
  );
  expect(result.rules).toEqual({
    env_names_list: ['HOME'],
    exception_messages_list: ['static'],
  });
});
test('Swift empty file obeys zero-metric and empty-map contracts', () => {
  const result = cli.parseAnalyseOutput(
    cli.expectSuccess(cli.runCli([...analyse, '--in', `${root}/empty.swift`])),
  );
  expect(Object.keys(result.rules)).toHaveLength(16);
  expect(result.rules.function_map).toEqual({});
  expect(result.rules.class_map).toEqual({});
  expect(
    Object.values(result.rules.file_metrics as Record<string, number>).every(
      (value) => value === 0,
    ),
  ).toBeTrue();
});
for (const path of ['', 'testdata/swift/missing.swift'])
  test(`Swift invalid source uses shared IO errors: ${path || 'empty stdin'}`, () => {
    const result = cli.runCli(path ? [...analyse, '--in', path] : analyse, '');
    expect(result.exitCode).toBe(2);
    expect(result.stderr.length).toBe(0);
    expect(cli.parseJsonErrorOutput(result.stdout).error.code).toBe('E_IO');
  });
test('Swift text usage errors are sent to stderr', () => {
  const result = cli.runCli(
    ['analyse', '--language', 'swift', '--rules', 'import_types_list'],
    'func f() {}',
  );
  expect(result.exitCode).toBe(2);
  expect(result.stdout.length).toBe(0);
  expect(result.stderr.toString()).toContain(
    'unsupported rule "import_types_list" for language "swift"',
  );
});

test('Swift XCTest filtering preserves Swift Testing parameterized declarations', () => {
  const source =
    'class Case: XCTestCase { func testReal(){ func testHelper() {} }; static func testStatic() {}; func testParameter(_ n: Int) {} }\n@Test(arguments: [1,2]) func dataTest(_ n: Int) {}';
  const result = cli.parseAnalyseOutput(
    cli.expectSuccess(
      cli.runCli(
        [
          'analyse',
          '--language',
          'swift',
          '--rules',
          'testcase_titles_list',
          '--json',
        ],
        source,
      ),
    ),
  );
  expect(result.rules.testcase_titles_list).toEqual([
    'Case.testReal()',
    'dataTest(_:Int)',
  ]);
});
test('Swift function-local class keys agree with method receivers through JSON output', () => {
  const result = cli.parseAnalyseOutput(
    cli.expectSuccess(
      cli.runCli(
        [
          'analyse',
          '--language',
          'swift',
          '--rules',
          'class_map,method_map,io_calls_count',
          '--json',
        ],
        'func outer(){ class Local { func work(){ print("hello") } } }',
      ),
    ),
  );
  const classes = result.rules.class_map as Record<
    string,
    { methodCount: number }
  >;
  const methods = result.rules.method_map as Record<
    string,
    { receiver: string; ioCallsCount: number }
  >;
  expect(classes['outer().Local'].methodCount).toBe(1);
  expect(methods['outer().Local.work()'].receiver).toBe('outer().Local');
  expect(methods['outer().Local.work()'].ioCallsCount).toBe(1);
});
test('Swift overloads are separate added symbols in diff output', () => {
  const source =
    'func load(_ x: Int) -> String { "integer" }\nfunc load(_ x: String) -> String { x }';
  const diff = cli.parseDiffOutput(
    cli.expectSuccess(
      cli.runCli(
        [
          'diff',
          '--from',
          `${root}/v1.swift`,
          '--language',
          'swift',
          '--rules',
          'function_map',
          '--json',
        ],
        source,
      ),
    ),
  );
  const entries = diff.rules.function_map as Record<string, { status: string }>;
  expect(entries['load(_:Int)->String'].status).toBe('added');
  expect(entries['load(_:String)->String'].status).toBe('added');
});
test('Swift wildcard and reordered explicit selectors return identical bytes', () => {
  const manifest = cli.parseRulesListOutput(
    cli.expectSuccess(cli.runCli(['rules', '--language', 'swift', '--json'])),
  );
  const names = manifest.rules
    .map((rule) => rule.name)
    .toReversed()
    .join(',');
  const base = [
    'analyse',
    '--language',
    'swift',
    '--in',
    `${root}/v1.swift`,
    '--json',
    '--rules',
  ];
  expect(
    cli.equalBytes(
      cli.expectSuccess(cli.runCli([...base, '*'])),
      cli.expectSuccess(cli.runCli([...base, names])),
    ),
  ).toBeTrue();
});
test('Swift IO prefix expansion selects exactly the three numeric count maps', () => {
  const parsed = cli.parseAnalyseOutput(
    cli.expectSuccess(
      cli.runCli([
        'analyse',
        '--language',
        'swift',
        '--in',
        `${root}/v1.swift`,
        '--rules',
        'io_*',
        '--json',
      ]),
    ),
  );
  expect(Object.keys(parsed.rules)).toEqual([
    'io_calls_count',
    'io_read_calls_count',
    'io_write_calls_count',
  ]);
  for (const counts of Object.values(parsed.rules) as {
    functions: Record<string, number>;
    methods: Record<string, number>;
  }[])
    expect(
      Object.values(counts.functions)
        .concat(Object.values(counts.methods))
        .every((value) => typeof value === 'number'),
    ).toBeTrue();
});
test('Swift unmatched selector errors preserve stdout JSON and repeated bytes', () => {
  const pair = cli.runTwice([
    'analyse',
    '--language',
    'swift',
    '--in',
    `${root}/v1.swift`,
    '--rules',
    'missing_*',
    '--json',
  ]);
  expect(pair.first.exitCode).toBe(2);
  expect(pair.first.stderr.length).toBe(0);
  expect(cli.equalBytes(pair.first.stdout, pair.second.stdout)).toBeTrue();
  expect(cli.parseJsonErrorOutput(pair.first.stdout).error.code).toBe(
    'E_USAGE',
  );
});
