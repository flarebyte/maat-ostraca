import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { runSwift } from '../src/rules/_shared/swift/analyse.js';
import { swiftRoot } from '../src/rules/_shared/swift/ast.js';
import type { RuleName } from '../src/rules/catalog.js';
import { dispatchRule } from '../src/rules/dispatch.js';
import { resolveRules } from '../src/rules/resolve.js';

const run = (rule: RuleName, source: string) =>
  runSwift({ language: 'swift', source }, rule);
for (const rule of resolveRules({ language: 'swift', rules: '*' }))
  test(`Swift ${rule} adapter and empty input`, async () => {
    const runner = await dispatchRule(rule, 'swift');
    const value = await runner({ language: 'swift', source: '' });
    assert.deepEqual(value, run(rule, ''));
    if (rule.endsWith('_map')) assert.deepEqual(value, {});
    if (rule.endsWith('_list')) assert.deepEqual(value, []);
    if (rule.startsWith('io_'))
      assert.deepEqual(value, { functions: {}, methods: {} });
  });
for (const [source, paths, roots] of [
  [
    'import Foundation\nimport struct Other.Module.Thing\n@testable import MyApp\nimport Foundation',
    ['Foundation', 'MyApp', 'Other.Module.Thing'],
    ['Foundation', 'MyApp', 'Other'],
  ],
  [
    '// import Fake\n/* import Hidden */\nimport func Darwin.getenv',
    ['Darwin.getenv'],
    ['Darwin'],
  ],
] as const)
  test(`Swift imports: ${source.split('\n')[0]}`, () => {
    assert.deepEqual(run('import_files_list', source), paths);
    assert.deepEqual(run('package_imports_list', source), roots);
  });
for (const [source, expected] of [
  [
    'func f(){ getenv("PATH"); ProcessInfo.processInfo.environment["HOME"]; getenv("PATH") }',
    ['HOME', 'PATH'],
  ],
  [
    'func f(){ Darwin.getenv("A"); Glibc.getenv("B"); Foundation.ProcessInfo.processInfo.environment["C"] }',
    ['A', 'B', 'C'],
  ],
  [
    'func f(){ getenv(name); getenv("prefix\\(name)"); other.environment["X"] }',
    [],
  ],
] as const)
  test('Swift environment literal extraction', () =>
    assert.deepEqual(run('env_names_list', source), expected));
for (const [source, expected] of [
  [
    'func f(){ fatalError("bad"); preconditionFailure("bad"); throw Failure(message: "thrown") }',
    ['bad', 'thrown'],
  ],
  [
    'func f(){ fatalError(message); fatalError("dynamic \\(value)"); fatalError(#"raw \\n"#) }',
    ['raw \\n'],
  ],
  [
    'func f(){ fatalError("line\\nnext"); fatalError("\\u{1F600}") }',
    ['line\nnext', '😀'],
  ],
] as const)
  test('Swift exception-like literal messages', () =>
    assert.deepEqual(run('exception_messages_list', source), expected));
test('Swift multiline string indentation and interpolation use Swift delimiters', () => {
  const source =
    'func f(){ fatalError("""\n  first\n  second\n  """); fatalError(#"not interpolation \\(x)"#); fatalError(#"interpolation \\#(x)"#) }';
  assert.deepEqual(run('exception_messages_list', source), [
    'first\nsecond',
    'not interpolation \\(x)',
  ]);
});
test('Swift error logging filters nonliteral and unrelated calls', () => {
  assert.deepEqual(
    run(
      'error_messages_list',
      'func f(){ logger.error("bad"); log.fault("fault"); Logger.critical("critical"); logger.info("skip"); logger.error(message) }',
    ),
    ['bad', 'critical', 'fault'],
  );
});
test('Swift overloads include argument labels, parameter types and explicit returns', () => {
  const source =
    'func load(_ value: Int) -> String { "int" }\nfunc load(_ value: String) -> String { value }\nfunc load(named value: String) -> String { value }';
  const value = run('function_map', source) as Record<
    string,
    Record<string, unknown>
  >;
  assert.deepEqual(Object.keys(value), [
    'load(_:Int)->String',
    'load(_:String)->String',
    'load(named:String)->String',
  ]);
  assert.deepEqual(value['load(named:String)->String'].params, [
    'named value: String',
  ]);
  assert.deepEqual(value['load(_:Int)->String'].returns, ['String']);
});
test('Swift nested functions remain free functions and keep enclosing scopes', () => {
  const source =
    'class C { func outer() { func inner() {} } }\nfunc top<T>(_ value: T) { func nested() {} }';
  assert.deepEqual(Object.keys(run('function_map', source) as object), [
    'C.outer().inner()',
    'top<T>(_:T)',
    'top<T>(_:T).nested()',
  ]);
  assert.deepEqual(Object.keys(run('method_map', source) as object), [
    'C.outer()',
  ]);
});
test('Swift extensions, structs, enums, actors and lifecycle declarations expose method fields', () => {
  const source =
    'class C { init() {} deinit {} }\nextension C { static func make() -> C { C() } }\nstruct S { mutating func update() {} }\nenum E { func value() {} }\nactor A { func get() async {} }';
  const methods = run('method_map', source) as Record<
    string,
    Record<string, unknown>
  >;
  assert.deepEqual(Object.keys(methods), [
    'C.init()',
    'C.deinit()',
    'C.make()->C',
    'S.update()',
    'E.value()',
    'A.get()',
  ]);
  assert.equal(methods['C.make()->C'].receiver, 'C');
  assert.deepEqual(methods['A.get()'].modifiers, ['async']);
  const classes = run('class_map', source) as Record<
    string,
    Record<string, unknown>
  >;
  assert.deepEqual(Object.keys(classes), ['C']);
  assert.equal(classes.C.methodCount, 3);
});
test('Swift class inheritance distinguishes locally known protocols and classes', () => {
  const source =
    'protocol P {}\nclass Base {}\nfinal class C: Base, P, Unknown { func f() {} }';
  const classes = run('class_map', source) as Record<
    string,
    Record<string, unknown>
  >;
  assert.equal(classes.C.extends, 'Base');
  assert.deepEqual(classes.C.implements, ['P']);
  assert.deepEqual(classes.C.modifiers, ['final']);
  assert.ok(!('loops' in classes.C));
});
test('Swift protocols preserve superprotocols and method signatures; properties are not methods', () => {
  const source =
    'public protocol P: Sendable { associatedtype Item; var value: String { get }; func read(_ path: String) async throws -> String }';
  assert.deepEqual(run('interface_map', source), {
    P: {
      modifiers: ['public'],
      extends: ['Sendable'],
      methods: ['func read(_ path: String) async throws -> String'],
    },
  });
  assert.deepEqual(run('interfaces_code_map', source), { P: source });
});
test('Swift IO maps use the same keys and counters as symbol maps', () => {
  const source =
    'func work(){ readLine(); let data = try Data(contentsOf: url); file.readToEnd(); print("hello"); debugPrint(data); file.write(data) }\nclass C { func idle() {} }';
  assert.deepEqual(run('io_calls_count', source), {
    functions: { 'work()': 6 },
    methods: { 'C.idle()': 0 },
  });
  assert.deepEqual(run('io_read_calls_count', source), {
    functions: { 'work()': 3 },
    methods: { 'C.idle()': 0 },
  });
  assert.deepEqual(run('io_write_calls_count', source), {
    functions: { 'work()': 3 },
    methods: { 'C.idle()': 0 },
  });
  const funcs = run('function_map', source) as Record<
    string,
    Record<string, number>
  >;
  assert.equal(funcs['work()'].ioCallsCount, 6);
});
test('Swift Testing and XCTest names exclude ordinary test-prefixed functions', () => {
  const source =
    '@Test("display") func one() {}\n@Test(arguments: [1,2]) func two(_ n: Int) {}\nclass Spec: XCTestCase { func testRead() {} func helper() {} }\nfunc testNotATest() {}';
  assert.deepEqual(run('testcase_titles_list', source), [
    'Spec.testRead()',
    'display',
    'two(_:Int)',
  ]);
});
test('Swift metrics ignore nested comments and strings and count control flow', () => {
  const source =
    'func f(){ /* for /* while */ if */ let s = "if while"; for x in xs { if ok { return } }; while ready {}; repeat {} while ready; guard ok else { return }; switch value { case 1: break; default: break } }';
  const value = run('file_metrics', source) as Record<string, number>;
  assert.equal(value.loops, 3);
  assert.equal(value.conditions, 3);
  assert.equal(value.cyclomaticComplexity, 7);
  assert.equal(value.maxNestingDepth, 3);
});
for (const source of ['', 'func café() { print("你好") }\n', 'func f() {}\r\n'])
  test(`Swift hash preserves input bytes: ${JSON.stringify(source)}`, () =>
    assert.deepEqual(run('code_hash', source), {
      algorithm: 'sha256',
      file: createHash('sha256').update(source).digest('hex'),
    }));
test('Swift parser validates the language and recovers incomplete source', () => {
  assert.throws(
    () => swiftRoot({ language: 'go', source: '' }),
    /unsupported language/,
  );
  assert.ok(
    Object.hasOwn(
      run('function_map', 'func complete() {}\nfunc incomplete(') as object,
      'complete()',
    ),
  );
});
for (const language of ['python', 'rust'])
  for (const order of [
    [language, 'swift'],
    ['swift', language],
  ])
    test(`Swift parser registration order: ${order.join(' then ')}`, () => {
      const script = `import { searchByKind } from './src/core/astgrep/search.ts'; for (const language of ${JSON.stringify(order)}) { const source = {swift:'func f() {}',rust:'fn f() {}',python:'def f(): pass'}[language]; const kindName = {swift:'function_declaration',rust:'function_item',python:'function_definition'}[language]; if ((await searchByKind({language,source,kindName})).length !== 1) throw Error(language); }`;
      const result = spawnSync(
        process.execPath,
        ['--import', 'tsx', '--input-type=module', '-e', script],
        { encoding: 'utf8' },
      );
      assert.equal(result.status, 0, result.stderr);
    });
for (const rule of ['import_functions_list', 'import_types_list'])
  test(`Swift rejects unsupported ${rule}`, () =>
    assert.throws(() => resolveRules({ language: 'swift', rules: rule })));

test('Swift computed string arguments are excluded rather than partially extracted', () => {
  const source =
    'func f(){ getenv("A" + name); fatalError("prefix" + value); logger.error("prefix" + value) }';
  for (const rule of [
    'env_names_list',
    'exception_messages_list',
    'error_messages_list',
  ] as const)
    assert.deepEqual(run(rule, source), []);
});
test('Swift comments between argument labels and values are ignored', () => {
  assert.deepEqual(
    run(
      'exception_messages_list',
      'func f(){ throw Failure(message: /* explanation */ "oops") }',
    ),
    ['oops'],
  );
});
test('Swift class keys and receivers preserve nested type scopes', () => {
  const source = 'class Outer { class Inner { func value() {} } }';
  assert.deepEqual(Object.keys(run('class_map', source) as object), [
    'Outer',
    'Outer.Inner',
  ]);
  const methods = run('method_map', source) as Record<
    string,
    Record<string, unknown>
  >;
  assert.equal(methods['Outer.Inner.value()'].receiver, 'Outer.Inner');
});
test('Swift class conformance does not guess unknown superclass or protocol names', () => {
  const value = run(
    'class_map',
    'class C: ExternalBase, ExternalProtocol {}',
  ) as Record<string, Record<string, unknown>>;
  assert.ok(!('extends' in value.C));
  assert.ok(!('implements' in value.C));
});
test('Swift extension methods retain type receivers without creating class entries', () => {
  const source = 'extension External where Element: Sendable { func get() {} }';
  assert.deepEqual(run('class_map', source), {});
  assert.deepEqual(Object.keys(run('method_map', source) as object), [
    'External.get()',
  ]);
});
test('Swift async throwing signatures preserve source modifiers and explicit parameters', () => {
  const source =
    '@MainActor public func fetch(label value: String = "default") async throws -> String { return value }';
  const functions = run('function_map', source) as Record<
    string,
    Record<string, unknown>
  >;
  assert.deepEqual(functions['fetch(label:String)->String'].modifiers, [
    'public',
    'async',
    'throws',
  ]);
  assert.deepEqual(functions['fetch(label:String)->String'].params, [
    'label value: String',
  ]);
});
test('Swift test-only imports and qualified attributes preserve static test discovery', () => {
  const source =
    '@testable import MyApp\n@Testing.Test func checks() {}\nclass Spec: XCTest.XCTestCase { func testOne() {} }';
  assert.deepEqual(run('testcase_titles_list', source), [
    'Spec.testOne()',
    'checks()',
  ]);
});
test('Swift opaque macros and string contents do not create executable I/O', () => {
  assert.deepEqual(
    run(
      'io_calls_count',
      'func f(){ #custom("print(fake)"); let s = "file.write(data)" }',
    ),
    { functions: { 'f()': 0 }, methods: {} },
  );
});
test('Swift nested closures and functions contribute to enclosing IO counters', () => {
  const value = run(
    'io_calls_count',
    'func outer(){ func inner(){ print("nested") }; let f = { readLine() } }',
  );
  assert.deepEqual(value, {
    functions: { 'outer()': 2, 'outer().inner()': 1 },
    methods: {},
  });
});
test('Swift raw string escapes use the matching hash delimiter', () => {
  assert.deepEqual(
    run(
      'exception_messages_list',
      'func f(){ fatalError(#"raw \\n"#); fatalError(#"line\\#nnext"#) }',
    ),
    ['line\nnext', 'raw \\n'],
  );
});

test('Swift escaped backslashes before parentheses are literal text', () => {
  const source = String.raw`func f(){ fatalError("literal \\(name)") }`;
  assert.deepEqual(run('exception_messages_list', source), [
    'literal \\(name)',
  ]);
});
test('Swift raw multiline strings respect the closing indentation', () => {
  const source = 'func f(){ fatalError(#"""\n  first\n    indented\n  """#) }';
  assert.deepEqual(run('exception_messages_list', source), [
    'first\n  indented',
  ]);
});
test('Swift empty and ternary string arguments are not partially evaluated', () => {
  assert.deepEqual(
    run(
      'error_messages_list',
      'func f(){ logger.error(""); logger.error(ok ? "a" : "b") }',
    ),
    [''],
  );
});

test('Swift thrown metadata labels are not mistaken for exception messages', () => {
  const source =
    'func f(){ throw NSError(domain: "example.domain", code: 1); throw Failure(reason: "reason"); throw Failure(description: "description") }';
  assert.deepEqual(run('exception_messages_list', source), [
    'description',
    'reason',
  ]);
});

test('Swift conditional compilation is inspected without selecting a platform', () => {
  const source =
    '#if os(Linux)\nfunc linuxOnly() {}\n#else\nfunc otherPlatform() {}\n#endif';
  assert.deepEqual(Object.keys(run('function_map', source) as object), [
    'linuxOnly()',
    'otherPlatform()',
  ]);
});
test('Swift comments do not create imports, tests or environment reads', () => {
  const source =
    '// import Fake\n/* @Test func fake() { getenv("HIDDEN") } */\nfunc real() {}';
  for (const rule of [
    'import_files_list',
    'testcase_titles_list',
    'env_names_list',
  ] as const)
    assert.deepEqual(run(rule, source), []);
});
test('Swift computed properties and subscripts are omitted from method maps', () => {
  const source =
    'struct S { var value: String { "value" }; subscript(index: Int) -> String { "subscript" } }';
  assert.deepEqual(run('method_map', source), {});
});

test('Swift XCTest discovery excludes nested helpers, static methods and parameterized helpers', () => {
  const source =
    'class Spec: XCTestCase { func testReal(){ func testNested() {} }; static func testStatic() {}; func testWithArgument(_ value: Int) {} }';
  assert.deepEqual(run('testcase_titles_list', source), ['Spec.testReal()']);
});
test('Swift classes declared inside functions share the receiver scope and method count', () => {
  const source = 'func outer(){ class Local { func work() {} } }';
  const classes = run('class_map', source) as Record<
    string,
    Record<string, unknown>
  >;
  assert.deepEqual(Object.keys(classes), ['outer().Local']);
  assert.equal(classes['outer().Local'].methodCount, 1);
  const methods = run('method_map', source) as Record<
    string,
    Record<string, unknown>
  >;
  assert.equal(methods['outer().Local.work()'].receiver, 'outer().Local');
});
test('Swift Testing arguments do not become display titles or runtime-expanded cases', () => {
  const source =
    '@Test(arguments: ["first", "second"]) func parameterized(_ value: String) {}';
  assert.deepEqual(run('testcase_titles_list', source), [
    'parameterized(_:String)',
  ]);
});
test('Swift method modifiers distinguish rethrows and mutating without changing JSON fields', () => {
  const value = run(
    'method_map',
    'struct S { mutating func update() {}; func execute(_ fn: () throws -> Void) rethrows { try fn() } }',
  ) as Record<string, Record<string, unknown>>;
  assert.deepEqual(value['S.update()'].modifiers, ['mutating']);
  assert.deepEqual(value['S.execute(_:() throws -> Void)'].modifiers, [
    'rethrows',
  ]);
});
test('Swift condition metrics include ternaries and default-only switches add no condition', () => {
  const metrics = run(
    'file_metrics',
    'func f(){ let value = ok ? 1 : 2; switch value { default: break } }',
  ) as Record<string, number>;
  assert.equal(metrics.conditions, 1);
  assert.equal(metrics.cyclomaticComplexity, 2);
});
test('Swift unmatched test prefixes and non-test attributes do not invent testcases', () => {
  assert.deepEqual(
    run(
      'testcase_titles_list',
      '@TestFactory func helper() {}\nclass Other { func testNotXCTest() {} }',
    ),
    [],
  );
});
test('Swift qualified standard IO and empty calls are classified without literal arguments', () => {
  assert.deepEqual(
    run(
      'io_calls_count',
      'func io(){ Swift.print(); Swift.debugPrint("x"); dump(value); FileHandle.standardInput.readDataToEndOfFile(); file.writeData(data) }',
    ),
    { functions: { 'io()': 5 }, methods: {} },
  );
});
