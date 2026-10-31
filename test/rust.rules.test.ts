import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { runRust } from '../src/rules/_shared/rust/analyse.js';
import { parseRust, stringValue } from '../src/rules/_shared/rust/ast.js';
import type { RuleName } from '../src/rules/catalog.js';
import { dispatchRule } from '../src/rules/dispatch.js';
import { resolveRules } from '../src/rules/resolve.js';

const run = (rule: RuleName, source: string) =>
  runRust({ language: 'rust', source }, rule);
const rules = resolveRules({ language: 'rust', rules: '*' });
for (const rule of rules)
  test(`Rust ${rule}: adapter supports empty source`, async () => {
    const adapter = await dispatchRule(rule, 'rust');
    const value = await adapter({ language: 'rust', source: '' });
    assert.deepEqual(value, run(rule, ''));
    if (rule.endsWith('_list')) assert.deepEqual(value, []);
    if (rule.endsWith('_map')) assert.deepEqual(value, {});
    if (rule.startsWith('io_'))
      assert.deepEqual(value, { functions: {}, methods: {} });
  });
for (const [title, source, paths, packages] of [
  [
    'grouped imports',
    'use std::{env as environment, fs::{self, read_to_string}, io::*};',
    ['std::env', 'std::fs', 'std::fs::read_to_string', 'std::io::*'],
    ['std'],
  ],
  [
    'relative paths',
    'use crate::local::Thing; use self::helper; use super::{a, b};',
    ['crate::local::Thing', 'self::helper', 'super::a', 'super::b'],
    [],
  ],
  [
    'reexports and external crates',
    'pub use serde::{Serialize, Deserialize}; extern crate alloc as memory; use serde::Serialize;',
    ['alloc', 'serde::Deserialize', 'serde::Serialize'],
    ['alloc', 'serde'],
  ],
  [
    'absolute imports',
    'use ::std::fs; use {std::env, std::io};',
    ['::std::fs', 'std::env', 'std::io'],
    ['std'],
  ],
  [
    'comments and macro definitions',
    '// use fake::x;\n/* use fake::y; */\nmacro_rules! imports { () => { use fake::z; } }',
    [],
    [],
  ],
] as const)
  test(`Rust imports: ${title}`, () => {
    assert.deepEqual(run('import_files_list', source), paths);
    assert.deepEqual(run('package_imports_list', source), packages);
  });
for (const [title, source, expected] of [
  [
    'standard functions and aliases',
    'use std::env::{var as get, var_os}; fn f() { get("HOME"); var_os(r#"PATH"#); }',
    ['HOME', 'PATH'],
  ],
  [
    'module aliases',
    'use std::env as system; fn f() { system::var("HOME"); system::var("HOME"); }',
    ['HOME'],
  ],
  [
    'compile time macros',
    'fn f() { env!("A"); option_env!(r"B"); std::env!("C"); }',
    ['A', 'B', 'C'],
  ],
  [
    'dynamic and unrelated calls',
    'fn f() { std::env::var(name); env!(concat!("A", "B")); custom::var("X"); env!("X" + "Y"); }',
    [],
  ],
  [
    'sorting and deduplication',
    'fn f() { env!("Z"); env!("A"); env!("Z"); }',
    ['A', 'Z'],
  ],
] as const)
  test(`Rust environment: ${title}`, () =>
    assert.deepEqual(run('env_names_list', source), expected));
for (const [rule, source, expected] of [
  [
    'exception_messages_list',
    'fn f(){ panic!("bad {}", x); std::panic!(r##"raw "quote""##); panic!(message); }',
    ['bad {}', 'raw "quote"'],
  ],
  [
    'error_messages_list',
    'use log::error as fail; fn f(){ fail!("logged"); Err("returned"); anyhow::bail!("bail"); anyhow!("bad"); tracing::error!("trace"); }',
    ['bad', 'bail', 'logged', 'returned', 'trace'],
  ],
  [
    'error_messages_list',
    'use std::io::Error; fn f(){ Error::new(kind, "io error"); Error::other("other"); log::info!("skip"); Err(format!("dynamic {}", x)); }',
    ['io error', 'other'],
  ],
  [
    'exception_messages_list',
    'fn f(){ panic!(r"line\nraw"); panic!("line\\nregular"); }',
    ['line\nraw', 'line\nregular'],
  ],
] as const)
  test(`Rust ${rule}: literal extraction`, () =>
    assert.deepEqual(run(rule, source), expected));
test('Rust nested modules, generics, lifetimes, associated functions and trait implementations retain distinct keys', () => {
  const source = `mod storage {
 pub unsafe fn fetch<'a, T>(value: &'a T) -> usize where T: Sized { return 1; }
 impl<T> Cache<T> { pub fn new() -> Self { Self {} } }
 impl<T> Reader for Cache<T> { fn read(&self) -> String { String::new() } }
 impl<T> Writer for Cache<T> { fn read(&mut self) { fn nested() {} } }
}`;
  const functions = run('function_map', source) as Record<
    string,
    Record<string, unknown>
  >;
  assert.deepEqual(Object.keys(functions), [
    'storage::fetch',
    'storage::<Cache<T> as Writer>::read::nested',
  ]);
  assert.deepEqual(functions['storage::fetch'].modifiers, ['pub', 'unsafe']);
  assert.deepEqual(functions['storage::fetch'].params, ["value: &'a T"]);
  assert.deepEqual(functions['storage::fetch'].returns, ['usize']);
  assert.equal(functions['storage::fetch'].returnCount, 1);
  const methods = run('method_map', source) as Record<
    string,
    Record<string, unknown>
  >;
  assert.deepEqual(Object.keys(methods), [
    'storage::Cache<T>::new',
    'storage::<Cache<T> as Reader>::read',
    'storage::<Cache<T> as Writer>::read',
  ]);
  assert.equal(methods['storage::Cache<T>::new'].receiver, 'storage::Cache<T>');
  assert.equal(methods['storage::<Cache<T> as Reader>::read'].name, 'read');
});
test('Rust traits map supertraits, signatures and default methods without inventing classes', () => {
  const source =
    'mod api { pub unsafe trait Reader: Send + Sync { type Item; const SIZE: usize; fn read(&self) -> String; fn café(&self) { println!("你好"); } } }';
  assert.deepEqual(run('interface_map', source), {
    'api::Reader': {
      modifiers: ['pub', 'unsafe'],
      extends: ['Send', 'Sync'],
      methods: ['fn café(&self);', 'fn read(&self) -> String;'],
    },
  });
  assert.deepEqual(run('interfaces_code_map', source), {
    'api::Reader':
      'pub unsafe trait Reader: Send + Sync { type Item; const SIZE: usize; fn read(&self) -> String; fn café(&self) { println!("你好"); } }',
  });
  assert.deepEqual(Object.keys(run('method_map', source) as object), [
    'api::Reader::café',
  ]);
});
test('Rust test detection uses attached attributes rather than function names', () => {
  const source = `fn test_not_a_test() {}
#[test]
// A comment between attribute and declaration.
fn real() {}
#[tokio::test(flavor = "current_thread")]
async fn async_case() {}
#[async_std::test] async fn another() {}
#[ignore] fn ignored_helper() {}
mod tests { #[test] fn nested() {} }
`;
  assert.deepEqual(run('testcase_titles_list', source), [
    'another',
    'async_case',
    'real',
    'tests::nested',
  ]);
});
test('Rust IO classification resolves aliases and agrees with symbol counters', () => {
  const source = `use std::fs::{read_to_string as load, write as save};
fn work() { load("x"); file.read_exact(buf); println!("hello"); save("x", b"y"); file.flush(); }
impl Worker { fn idle(&self) {} }`;
  assert.deepEqual(run('io_calls_count', source), {
    functions: { work: 5 },
    methods: { 'Worker::idle': 0 },
  });
  assert.deepEqual(run('io_read_calls_count', source), {
    functions: { work: 2 },
    methods: { 'Worker::idle': 0 },
  });
  assert.deepEqual(run('io_write_calls_count', source), {
    functions: { work: 3 },
    methods: { 'Worker::idle': 0 },
  });
  const functions = run('function_map', source) as Record<
    string,
    Record<string, number>
  >;
  assert.equal(functions.work.ioCallsCount, 5);
  assert.equal(functions.work.ioReadCallsCount, 2);
  assert.equal(functions.work.ioWriteCallsCount, 3);
});
test('Rust metrics count loops, match arms and guards while ignoring nested comments and raw strings', () => {
  const source = `fn f() {
 /* for { /* if */ while } */
 let s = r##"if { loop while }"##;
 loop { break; }
 while ready { break; }
 for x in xs { if x { return; } }
 match value { Some(x) if x > 0 => (), None => (), _ => () }
}`;
  const metrics = run('file_metrics', source) as Record<string, number>;
  assert.equal(metrics.loops, 3);
  assert.equal(metrics.conditions, 4);
  assert.equal(metrics.cyclomaticComplexity, 8);
  assert.equal(metrics.cognitiveComplexity, 8);
  assert.equal(metrics.maxNestingDepth, 3);
});
test('Rust file metrics are zero for empty source and preserve trailing-newline LOC', () => {
  assert.deepEqual(run('file_metrics', ''), {
    loc: 0,
    sloc: 0,
    loops: 0,
    conditions: 0,
    tokens: 0,
    maxNestingDepth: 0,
    cyclomaticComplexity: 0,
    cognitiveComplexity: 0,
  });
  assert.equal(
    (run('file_metrics', 'fn f() {}\n') as Record<string, number>).loc,
    2,
  );
});
for (const source of [
  '',
  '// comment\n',
  'fn café() { "你好"; }\n',
  'fn f() {}\r\n',
])
  test(`Rust hash is SHA256 of source bytes: ${JSON.stringify(source)}`, () =>
    assert.deepEqual(run('code_hash', source), {
      algorithm: 'sha256',
      file: createHash('sha256').update(source).digest('hex'),
    }));
for (const rule of ['class_map', 'import_functions_list', 'import_types_list'])
  test(`Rust unsupported ${rule} is rejected`, () =>
    assert.throws(() => resolveRules({ language: 'rust', rules: rule })));
for (const order of [
  ['rust', 'python'],
  ['python', 'rust'],
])
  test(`Dynamic parser registration supports ${order.join(' then ')}`, () => {
    const script = `import { searchByKind } from './src/core/astgrep/search.ts';
    for (const language of ${JSON.stringify(order)}) {
      const matches = await searchByKind({ language, source: language === 'rust' ? 'fn f() {}' : 'def f(): pass', kindName: language === 'rust' ? 'function_item' : 'function_definition' });
      if (matches.length !== 1) throw new Error(language);
    }`;
    const result = spawnSync(
      process.execPath,
      ['--import', 'tsx', '--input-type=module', '-e', script],
      { encoding: 'utf8' },
    );
    assert.equal(result.status, 0, result.stderr);
  });
test('Rust parser rejects a mismatched language deterministically', () =>
  assert.throws(
    () => parseRust({ source: '', language: 'go' }),
    /unsupported language/,
  ));
test('Rust literal helper ignores non-string syntax', () =>
  assert.equal(stringValue(null), undefined));

test('Rust literal decoding handles escapes, Unicode code points and byte strings without executing code', () => {
  const source = String.raw`fn f() { panic!("\u{1F600} \x41\t\0\"\\"); panic!(b"bytes"); }`;
  assert.deepEqual(run('exception_messages_list', source), ['😀 A\t\0"\\']);
});
test('Rust continuation escapes and multiple raw-string delimiters are preserved correctly', () => {
  const source =
    'fn f() { panic!("first\\\n  second"); panic!(r###"raw\\n"###); }';
  assert.deepEqual(run('exception_messages_list', source), [
    'firstsecond',
    'raw\\n',
  ]);
});
test('Rust modifiers retain async, const, restricted visibility and extern ABI', () => {
  const source =
    'pub(crate) const fn one() -> u8 { 1 }\npub unsafe extern "C" fn two() {}\nasync fn three() {}';
  const functions = run('function_map', source) as Record<
    string,
    Record<string, unknown>
  >;
  assert.deepEqual(functions.one.modifiers, ['pub(crate)', 'const']);
  assert.deepEqual(functions.two.modifiers, ['pub', 'unsafe', 'extern "C"']);
  assert.deepEqual(functions.three.modifiers, ['async']);
});
test('Rust generics, closures, turbofish calls and additional IO patterns remain syntactic', () => {
  const source =
    'use std::fs; fn f() { let closure = || { fs::read("x"); }; std::fs::read_to_string::<&str>("y"); input.read_line(&mut text); output.write_all(b"z"); writeln!(output, "line"); }';
  assert.deepEqual(run('io_calls_count', source), {
    functions: { f: 5 },
    methods: {},
  });
  assert.deepEqual(Object.keys(run('function_map', source) as object), ['f']);
});
test('Rust trait maps support traits without supertraits and comments between attributes', () => {
  const source = '#[test]\n/* comment */\nfn case() {}\ntrait Marker {}';
  assert.deepEqual(run('testcase_titles_list', source), ['case']);
  assert.deepEqual(run('interface_map', source), {
    Marker: { modifiers: [], extends: [], methods: [] },
  });
});
test('Rust parser recovers deterministically around incomplete source', () => {
  const source = 'fn complete() {}\nfn incomplete(';
  assert.ok(Object.hasOwn(run('function_map', source) as object, 'complete'));
  assert.deepEqual(run('file_metrics', source), run('file_metrics', source));
});
test('Rust cfg branches are inspected without evaluating attributes', () => {
  const source =
    '#[cfg(unix)] fn unix_only() {}\n#[cfg(windows)] fn windows_only() {}';
  assert.deepEqual(Object.keys(run('function_map', source) as object), [
    'unix_only',
    'windows_only',
  ]);
});

test('Rust grouped imports ignore comments between paths', () => {
  assert.deepEqual(
    run(
      'import_files_list',
      'use std::{/* module */ env, fs::{self, // reader\n read}};',
    ),
    ['std::env', 'std::fs', 'std::fs::read'],
  );
});
test('Rust Error::new ignores comments when selecting its second argument', () => {
  assert.deepEqual(
    run(
      'error_messages_list',
      'fn f(){ std::io::Error::new(/* kind */ kind, /* message */ "failed"); }',
    ),
    ['failed'],
  );
});
test('Rust empty, computed and byte-string messages are not confused with text literals', () => {
  assert.deepEqual(
    run(
      'exception_messages_list',
      'fn f(){ panic!(); panic!(b"bytes"); panic!(format!("computed")); panic!(""); }',
    ),
    [''],
  );
});
test('Rust nested IO is counted in the enclosing declaration and nested function', () => {
  const source =
    'fn outer(){ fn inner(){ println!("nested"); } let f = || std::fs::read("x"); }';
  assert.deepEqual(run('io_calls_count', source), {
    functions: { outer: 2, 'outer::inner': 1 },
    methods: {},
  });
});
test('Rust conditional duplicate keys keep the final declaration', () => {
  const result = run(
    'function_map',
    '#[cfg(unix)] fn f() -> u8 {1}\n#[cfg(windows)] fn f() -> u16 {2}',
  ) as Record<string, Record<string, unknown>>;
  assert.deepEqual(Object.keys(result), ['f']);
  assert.deepEqual(result.f.returns, ['u16']);
});
test('Rust associated types and constants do not become interface methods', () => {
  assert.deepEqual(
    run('interface_map', 'trait Storage { type Item; const SIZE: usize; }'),
    { Storage: { modifiers: [], extends: [], methods: [] } },
  );
});
test('Rust raw identifiers and nested modules retain qualified names', () => {
  assert.deepEqual(
    Object.keys(
      run('function_map', 'mod a { mod b { fn r#type() {} } }') as object,
    ),
    ['a::b::r#type'],
  );
});
test('Rust macro bodies and attributes do not invent executed IO calls', () => {
  const source =
    'macro_rules! output { () => { println!("expanded"); } }\n#[doc = "println!(fake)"] fn f(){ output!(); let s = "std::fs::read(fake)"; }';
  assert.deepEqual(run('io_calls_count', source), {
    functions: { f: 0 },
    methods: {},
  });
});
