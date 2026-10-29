import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { runPython } from '../src/rules/_shared/python/analyse.js';
import { dispatchRule } from '../src/rules/dispatch.js';
import { resolveRules } from '../src/rules/resolve.js';

const run = (rule: string, source: string) =>
  runPython({ language: 'python', source }, rule);
const rules = resolveRules({ language: 'python', rules: '*' });
for (const rule of rules) {
  test(`Python ${rule}: dispatch, empty source and deterministic output`, async () => {
    const runner = await dispatchRule(rule, 'python');
    const actual = await runner({ language: 'python', source: '' });
    assert.deepEqual(actual, run(rule, ''));
    if (rule.endsWith('_list')) assert.deepEqual(actual, []);
    if (rule.endsWith('_map')) assert.deepEqual(actual, {});
    if (rule.startsWith('io_'))
      assert.deepEqual(actual, { functions: {}, methods: {} });
  });
}
for (const [title, source, expected] of [
  [
    'aliases',
    'import os as system\nfrom os import getenv as env\nsystem.getenv("B")\nenv("A")',
    ['A', 'B'],
  ],
  [
    'from imports and subscripts',
    'from os import environ\nenviron["A"]\nos.environ.get("B")',
    ['A', 'B'],
  ],
  [
    'deduplication',
    'os.getenv("Z")\nos.getenv("A")\nos.getenv("Z")',
    ['A', 'Z'],
  ],
  [
    'dynamic and unrelated calls',
    'custom.getenv("X")\nos.getenv(name)\nos.getenv(f"{name}")',
    [],
  ],
  ['comments and strings', '# os.getenv("X")\ns = \'os.getenv("Y")\'', []],
] as const)
  test(`Python env: ${title}`, () =>
    assert.deepEqual(run('env_names_list', source), expected));
for (const [rule, source, expected] of [
  [
    'import_files_list',
    'import os.path as p, sys\nfrom ..utils import (a, b)\nfrom . import c\nimport sys',
    ['.', '..utils', 'os.path', 'sys'],
  ],
  [
    'package_imports_list',
    'import os.path\nfrom .local import a\nfrom typing import Any',
    ['os.path', 'typing'],
  ],
  [
    'exception_messages_list',
    'raise ValueError("bad")\nraise RuntimeError("bad")\nraise ValueError(f"{value}")\nraise ValueError(message)',
    ['bad'],
  ],
  [
    'error_messages_list',
    'import logging as log\nlog.error("bad")\nlogger.exception("oops")\nlogging.critical("stop")\nlogging.info("skip")',
    ['bad', 'oops', 'stop'],
  ],
  [
    'exception_messages_list',
    'raise ValueError("""multi\nline""")\nraise ValueError(r"raw")',
    ['multi\nline', 'raw'],
  ],
  [
    'testcase_titles_list',
    'def helper(): pass\ndef test_one(): pass\nclass TestSuite:\n def test_two(self): pass',
    ['TestSuite.test_two', 'test_one'],
  ],
] as const)
  test(`Python ${rule}: ${source.split('\n')[0]}`, () =>
    assert.deepEqual(run(rule, source), expected));
test('Python symbol scopes, decorators, parameters and return annotations', () => {
  const source =
    'class Service(Base):\n @staticmethod\n async def load(value: int = 1, *args, **kwargs) -> str:\n  def nested(): return 1\n  return "ok"\ndef outer():\n def nested(): return 2\n return nested()';
  const methods = run('method_map', source) as Record<
    string,
    Record<string, unknown>
  >;
  assert.deepEqual(Object.keys(methods), ['Service.load']);
  assert.deepEqual(methods['Service.load'].modifiers, [
    'async',
    'staticmethod',
  ]);
  assert.deepEqual(methods['Service.load'].params, [
    'value: int = 1',
    '*args',
    '**kwargs',
  ]);
  assert.deepEqual(methods['Service.load'].returns, ['str']);
  assert.equal(methods['Service.load'].receiver, 'Service');
  const functions = run('function_map', source) as Record<string, unknown>;
  assert.deepEqual(Object.keys(functions), [
    'Service.load.nested',
    'outer',
    'outer.nested',
  ]);
  const classes = run('class_map', source) as Record<
    string,
    Record<string, unknown>
  >;
  assert.equal(classes.Service.extends, 'Base');
  assert.equal(classes.Service.methodCount, 1);
});
test('Python metrics count syntax rather than keywords inside literals', () => {
  const result = run(
    'file_metrics',
    'def f():\n # if for while\n text = "if for while"\n for x in xs:\n  if x:\n   pass\n  elif y:\n   pass\n while ready:\n  pass',
  ) as Record<string, number>;
  assert.equal(result.loops, 2);
  assert.equal(result.conditions, 2);
  assert.equal(result.cyclomaticComplexity, 5);
  assert.equal(result.maxNestingDepth, 3);
});
test('Python IO rules agree with symbol counters, including nested declarations', () => {
  const source =
    'def f():\n input()\n stream.read()\n print("x")\n stream.write("y")\n def inner():\n  os.read(0, 1)\nclass C:\n def m(self):\n  pass';
  assert.deepEqual(run('io_read_calls_count', source), {
    functions: { f: 3, 'f.inner': 1 },
    methods: { 'C.m': 0 },
  });
  assert.deepEqual(run('io_write_calls_count', source), {
    functions: { f: 2, 'f.inner': 0 },
    methods: { 'C.m': 0 },
  });
  assert.deepEqual(run('io_calls_count', source), {
    functions: { f: 5, 'f.inner': 1 },
    methods: { 'C.m': 0 },
  });
  const functions = run('function_map', source) as Record<
    string,
    Record<string, number>
  >;
  assert.equal(functions.f.ioCallsCount, 5);
});
for (const source of [
  '',
  '# comment\n',
  'def café():\n return "你好"\n',
  'x = 1\r\n',
])
  test(`Python hash preserves source bytes: ${JSON.stringify(source)}`, () => {
    assert.deepEqual(run('code_hash', source), {
      algorithm: 'sha256',
      file: createHash('sha256').update(source).digest('hex'),
    });
  });
for (const rule of [
  'interface_map',
  'interfaces_code_map',
  'import_functions_list',
  'import_types_list',
])
  test(`Python rejects unsupported ${rule}`, () =>
    assert.throws(() => resolveRules({ language: 'python', rules: rule })));
