import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runPython } from '../src/rules/_shared/python/analyse.js';
import { resolveRules } from '../src/rules/resolve.js';

const source = `import os as operating
from .helpers import read
class Reader:
    async def test_read(self):
        print("hello")
        return input()
def test_env():
    return os.getenv("HOME")
`;
const run = (rule: string) => runPython({ source, language: 'python' }, rule);
test('Python imports retain relative paths and exclude them from packages', () => {
  assert.deepEqual(run('import_files_list'), ['.helpers', 'os']);
  assert.deepEqual(run('package_imports_list'), ['os']);
});
test('Python symbols and IO have stable shared shapes', () => {
  const methods = run('method_map') as Record<string, Record<string, unknown>>;
  assert.deepEqual(methods['Reader.test_read'].modifiers, ['async']);
  assert.equal(methods['Reader.test_read'].ioCallsCount, 2);
  assert.deepEqual(run('env_names_list'), ['HOME']);
  assert.deepEqual(run('testcase_titles_list'), [
    'Reader.test_read',
    'test_env',
  ]);
});
test('all advertised Python rules run deterministically', () => {
  for (const rule of resolveRules({ rules: '*', language: 'python' }))
    assert.deepEqual(run(rule), run(rule));
  assert.throws(() =>
    resolveRules({ rules: 'interface_map', language: 'python' }),
  );
});
