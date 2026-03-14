import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canonicalStringify } from '../src/core/format/canonical-json.js';
import { run } from '../src/rules/testcase_titles_list/dart.js';

describe('rule testcase_titles_list/dart', () => {
  it('includes test, testWidgets, and group while excluding non-literals', async () => {
    const source = [
      "test('case-a', () {});",
      'test("case-b", () {});',
      "testWidgets('widget case', (tester) async {});",
      'group("""group suite""", () {});',
      'test(name, () {});',
      "test('x' + suffix, () {});",
      'group("hello $name", () {});',
      'testWidgets(title, (tester) async {});',
    ].join('\n');

    const result = await run({ source, language: 'dart' });

    assert.deepEqual(result, [
      'case-a',
      'case-b',
      'group suite',
      'widget case',
    ]);
  });

  it('dedupes and sorts deterministically', async () => {
    const source = [
      "test('zeta', () {});",
      'group("alpha", () {});',
      "testWidgets('zeta', (tester) async {});",
    ].join('\n');

    const first = await run({ source, language: 'dart' });
    const second = await run({ source, language: 'dart' });

    assert.deepEqual(first, ['alpha', 'zeta']);
    assert.equal(canonicalStringify(first), canonicalStringify(second));
  });
});
