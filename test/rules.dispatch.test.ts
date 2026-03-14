import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { UsageError } from '../src/core/errors/index.js';
import { dispatchRule } from '../src/rules/dispatch.js';

describe('rules.dispatch', () => {
  it('resolves known go rule-language module', async () => {
    const run = await dispatchRule('import_files_list', 'go');
    const value = (await run({
      source: 'package main\nimport "fmt"\n',
      language: 'go',
    })) as string[];

    assert.deepEqual(value, ['fmt']);
  });

  it('resolves known go package import rule-language module', async () => {
    const run = await dispatchRule('package_imports_list', 'go');
    const value = (await run({
      source: 'package main\nimport "fmt"\n',
      language: 'go',
    })) as string[];

    assert.deepEqual(value, ['fmt']);
  });

  it('resolves known go file metrics rule-language module', async () => {
    const run = await dispatchRule('file_metrics', 'go');
    const value = (await run({
      source: 'package main\n\nfunc main() {}\n',
      language: 'go',
    })) as { loc: number; sloc: number };

    assert.equal(value.loc, 4);
    assert.equal(value.sloc, 2);
  });

  it('resolves known go code hash rule-language module', async () => {
    const run = await dispatchRule('code_hash', 'go');
    const value = (await run({
      source: 'package main\n',
      language: 'go',
    })) as { algorithm: string; file: string };

    assert.equal(value.algorithm, 'sha256');
    assert.equal(
      value.file,
      'df1d036cbbf3df46e2045071e082245ece204c7f53ecf0a4e022bff9bb228f47',
    );
  });

  it('resolves known go function map rule-language module', async () => {
    const run = await dispatchRule('function_map', 'go');
    const value = (await run({
      source: 'package main\n\nfunc Charge() error { return nil }\n',
      language: 'go',
    })) as Record<string, { params: string[]; returns: string[] }>;

    assert.deepEqual(value, {
      Charge: { modifiers: [], params: [], returns: ['error'] },
    });
  });

  it('resolves known go method map rule-language module', async () => {
    const run = await dispatchRule('method_map', 'go');
    const value = (await run({
      source:
        'package main\n\ntype PaymentService struct{}\n\nfunc (s *PaymentService) Charge() error { return nil }\n',
      language: 'go',
    })) as Record<
      string,
      { receiver: string; name: string; params: string[]; returns: string[] }
    >;

    assert.deepEqual(value, {
      paymentServiceCharge: {
        modifiers: [],
        receiver: 'PaymentService',
        name: 'Charge',
        params: [],
        returns: ['error'],
      },
    });
  });

  it('resolves known rule-language module', async () => {
    const run = await dispatchRule('code_hash', 'typescript');
    const value = (await run({
      source: 'const a = 1;\n',
      language: 'typescript',
    })) as { algorithm: string; file: string };

    assert.equal(value.algorithm, 'sha256');
    assert.equal(
      value.file,
      'b79b14bd2584dd52b0f0ef042a2a4f104cda48330500e12237737cc51fbda43d',
    );
  });

  it('fails deterministically for missing implementation', async () => {
    await assert.rejects(
      async () => dispatchRule('import_functions_list', 'typescript'),
      new UsageError(
        'rule "import_functions_list" is not implemented for language "typescript"',
      ),
    );
  });
});
