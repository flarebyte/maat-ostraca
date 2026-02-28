import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  AnalyseOutputSchema,
  DiffOutputSchema,
  JsonErrorOutputSchema,
  RulesListOutputSchema,
} from '../src/core/contracts/schemas.js';

describe('contracts schemas', () => {
  it('parses valid analyse output', () => {
    const parsed = AnalyseOutputSchema.safeParse({
      filename: 'a.ts',
      language: 'typescript',
      rules: { import_files_list: null },
    });

    assert.equal(parsed.success, true);
  });

  it('fails invalid analyse output deterministically', () => {
    const parsed = AnalyseOutputSchema.safeParse({
      rules: {},
    });

    assert.equal(parsed.success, false);
    if (!parsed.success) {
      assert.equal(parsed.error.issues[0]?.path.join('.'), 'language');
    }
  });

  it('parses valid rules list output', () => {
    const parsed = RulesListOutputSchema.safeParse({
      language: 'typescript',
      rules: [{ name: 'import_files_list', description: 'desc' }],
    });

    assert.equal(parsed.success, true);
  });

  it('fails invalid rules list output deterministically', () => {
    const parsed = RulesListOutputSchema.safeParse({
      language: 'typescript',
      rules: [{ description: 'desc' }],
    });

    assert.equal(parsed.success, false);
    if (!parsed.success) {
      assert.equal(parsed.error.issues[0]?.path.join('.'), 'rules.0.name');
    }
  });

  it('parses valid diff output', () => {
    const parsed = DiffOutputSchema.safeParse({
      from: { filename: 'from.ts', language: 'typescript' },
      to: { language: 'typescript' },
      rules: { import_files_list: null },
    });

    assert.equal(parsed.success, true);
  });

  it('fails invalid diff output deterministically', () => {
    const parsed = DiffOutputSchema.safeParse({
      to: { language: 'typescript' },
      rules: {},
    });

    assert.equal(parsed.success, false);
    if (!parsed.success) {
      assert.equal(parsed.error.issues[0]?.path.join('.'), 'from');
    }
  });

  it('parses valid json error output', () => {
    const parsed = JsonErrorOutputSchema.safeParse({
      error: { code: 'E_USAGE', message: 'bad input' },
    });

    assert.equal(parsed.success, true);
  });

  it('fails invalid json error output deterministically', () => {
    const parsed = JsonErrorOutputSchema.safeParse({
      error: { code: 'E_USAGE' },
    });

    assert.equal(parsed.success, false);
    if (!parsed.success) {
      assert.equal(parsed.error.issues[0]?.path.join('.'), 'error.message');
    }
  });
});
