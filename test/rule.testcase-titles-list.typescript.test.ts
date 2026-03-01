import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { run } from '../src/rules/testcase_titles_list/typescript.js';

describe('rule testcase_titles_list/typescript', () => {
  it('includes describe/it/test with only and skip variants', async () => {
    const source = [
      'describe("suite-a", () => {});',
      "describe.only('suite-b', () => {});",
      'describe.skip(`suite-c`, () => {});',
      'it("case-a", () => {});',
      "it.only('case-b', () => {});",
      'it.skip(`case-c`, () => {});',
      'test("case-d", () => {});',
      "test.only('case-e', () => {});",
      'test.skip(`case-f`, () => {});',
    ].join('\n');

    const result = await run({ source, language: 'typescript' });
    assert.deepEqual(result, [
      'case-a',
      'case-b',
      'case-c',
      'case-d',
      'case-e',
      'case-f',
      'suite-a',
      'suite-b',
      'suite-c',
    ]);
  });

  it('excludes non-literal first arguments and dedupes sorted output', async () => {
    const source = [
      'const t = "name";',
      'describe("same", () => {});',
      'describe("same", () => {});',
      'it(t, () => {});',
      'test("x" + t, () => {});',
      'it(' + '`bad_' + '$' + '{t}`' + ', () => {});',
      'describe(' + '`ok`' + ', () => {});',
    ].join('\n');

    const result = await run({ source, language: 'typescript' });
    assert.deepEqual(result, ['ok', 'same']);
  });
});
