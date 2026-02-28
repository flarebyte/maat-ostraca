import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { RuleResolutionError, resolveRules } from '../src/rules/index.js';

describe('rules.resolve', () => {
  it('expands import_* correctly', () => {
    const resolved = resolveRules({
      rules: 'import_*',
      language: 'typescript',
    });

    assert.deepEqual(resolved, [
      'import_files_list',
      'import_functions_list',
      'import_types_list',
    ]);
  });

  it('expands multiple selectors and explicit names', () => {
    const resolved = resolveRules({
      rules: 'import_*, io_*, code_hash, import_files_list',
      language: 'typescript',
    });

    assert.deepEqual(resolved, [
      'code_hash',
      'import_files_list',
      'import_functions_list',
      'import_types_list',
      'io_calls_count',
      'io_read_calls_count',
      'io_write_calls_count',
    ]);
  });

  it('deduplicates and sorts deterministically', () => {
    const resolved = resolveRules({
      rules: 'io_write_calls_count, io_*, io_calls_count',
      language: 'go',
    });

    assert.deepEqual(resolved, [
      'io_calls_count',
      'io_read_calls_count',
      'io_write_calls_count',
    ]);
  });

  it('rejects unknown explicit rule', () => {
    assert.throws(
      () => resolveRules({ rules: 'unknown_rule', language: 'typescript' }),
      new RuleResolutionError(
        'unknown rule "unknown_rule" for language "typescript"',
      ),
    );
  });

  it('rejects wildcard with zero matches', () => {
    assert.throws(
      () => resolveRules({ rules: 'unknown_*', language: 'typescript' }),
      new RuleResolutionError(
        'wildcard selector "unknown_*" matched no rules for language "typescript"',
      ),
    );
  });

  it('rejects rule not supported for language', () => {
    assert.throws(
      () => resolveRules({ rules: 'interfaces_code_map', language: 'go' }),
      new RuleResolutionError(
        'unsupported rule "interfaces_code_map" for language "go"',
      ),
    );
  });
});
