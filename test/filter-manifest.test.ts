import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { UsageError } from '../src/core/errors/index.js';
import { filterRulesManifest } from '../src/rules/filter_manifest.js';

describe('filterRulesManifest', () => {
  it('returns the expected exact-match subset', () => {
    const result = filterRulesManifest({
      language: 'typescript',
      match: 'function_map,code_hash',
    });

    assert.deepEqual(
      result.map((entry) => entry.name),
      ['code_hash', 'function_map'],
    );
  });

  it('keeps lexicographic order regardless of input order', () => {
    const result = filterRulesManifest({
      language: 'go',
      match: 'interface_map,code_hash',
    });

    assert.deepEqual(
      result.map((entry) => entry.name),
      ['code_hash', 'interface_map'],
    );
  });

  it('ignores empty tokens', () => {
    const result = filterRulesManifest({
      language: 'dart',
      match: ' , class_map, , testcase_titles_list ,, ',
    });

    assert.deepEqual(
      result.map((entry) => entry.name),
      ['class_map', 'testcase_titles_list'],
    );
  });

  it('errors when all tokens are empty after trimming', () => {
    assert.throws(
      () => filterRulesManifest({ language: 'typescript', match: ' , , ' }),
      new UsageError('no rules matched for language "typescript"'),
    );
  });

  it('errors for unknown rule names', () => {
    assert.throws(
      () =>
        filterRulesManifest({
          language: 'typescript',
          match: 'code_hash,missing_rule',
        }),
      new UsageError('unknown rule "missing_rule" for language "typescript"'),
    );
  });

  it('errors for rules unsupported by the selected language', () => {
    assert.throws(
      () =>
        filterRulesManifest({
          language: 'go',
          match: 'class_map',
        }),
      new UsageError('unsupported rule "class_map" for language "go"'),
    );
  });
});
