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
    })) as Record<
      string,
      {
        modifiers: string[];
        params: string[];
        returns: string[];
        loc: number;
        returnCount: number;
        sha256: string;
      }
    >;

    assert.deepEqual(value.Charge?.modifiers, []);
    assert.deepEqual(value.Charge?.params, []);
    assert.deepEqual(value.Charge?.returns, ['error']);
    assert.equal(value.Charge?.loc, 1);
    assert.equal(value.Charge?.returnCount, 1);
    assert.equal(value.Charge?.sha256.length, 64);
  });

  it('resolves known go method map rule-language module', async () => {
    const run = await dispatchRule('method_map', 'go');
    const value = (await run({
      source:
        'package main\n\ntype PaymentService struct{}\n\nfunc (s *PaymentService) Charge() error { return nil }\n',
      language: 'go',
    })) as Record<
      string,
      {
        receiver: string;
        name: string;
        params: string[];
        returns: string[];
        loc: number;
        returnCount: number;
        sha256: string;
      }
    >;

    assert.deepEqual(value.paymentServiceCharge?.modifiers, []);
    assert.equal(value.paymentServiceCharge?.receiver, 'PaymentService');
    assert.equal(value.paymentServiceCharge?.name, 'Charge');
    assert.deepEqual(value.paymentServiceCharge?.params, []);
    assert.deepEqual(value.paymentServiceCharge?.returns, ['error']);
    assert.equal(value.paymentServiceCharge?.loc, 1);
    assert.equal(value.paymentServiceCharge?.returnCount, 1);
    assert.equal(value.paymentServiceCharge?.sha256.length, 64);
  });

  it('resolves known go interface map rule-language module', async () => {
    const run = await dispatchRule('interface_map', 'go');
    const value = (await run({
      source:
        'package main\n\ntype Reader interface { Read([]byte) (int, error) }\n',
      language: 'go',
    })) as Record<string, { extends: string[]; methods: string[] }>;

    assert.deepEqual(value, {
      Reader: {
        modifiers: [],
        extends: [],
        methods: ['Read([]byte) (int, error)'],
      },
    });
  });

  it('resolves known go interfaces code map rule-language module', async () => {
    const run = await dispatchRule('interfaces_code_map', 'go');
    const value = (await run({
      source:
        'package main\n\ntype Reader interface { Read([]byte) (int, error) }\n',
      language: 'go',
    })) as Record<string, string>;

    assert.equal(
      value.Reader,
      'type Reader interface { Read([]byte) (int, error) }',
    );
  });

  it('resolves known go io count rule-language modules', async () => {
    const runAll = await dispatchRule('io_calls_count', 'go');
    const runRead = await dispatchRule('io_read_calls_count', 'go');
    const runWrite = await dispatchRule('io_write_calls_count', 'go');
    const source =
      'package main\n\nfunc Load() { os.ReadFile("a"); fmt.Println("ok") }\n';

    const all = (await runAll({
      source,
      language: 'go',
    })) as { functions: Record<string, number> };
    const read = (await runRead({
      source,
      language: 'go',
    })) as { functions: Record<string, number> };
    const write = (await runWrite({
      source,
      language: 'go',
    })) as { functions: Record<string, number> };

    assert.deepEqual(all.functions, { Load: 2 });
    assert.deepEqual(read.functions, { Load: 1 });
    assert.deepEqual(write.functions, { Load: 1 });
  });

  it('resolves known go message rule-language modules', async () => {
    const runError = await dispatchRule('error_messages_list', 'go');
    const runException = await dispatchRule('exception_messages_list', 'go');
    const source =
      'package main\n\nfunc demo() { errors.New("x"); panic("boom"); panic(err) }\n';

    const errorMessages = (await runError({
      source,
      language: 'go',
    })) as string[];
    const exceptionMessages = (await runException({
      source,
      language: 'go',
    })) as string[];

    assert.deepEqual(errorMessages, ['boom', 'x']);
    assert.deepEqual(exceptionMessages, ['boom']);
  });

  it('resolves known go env names rule-language module', async () => {
    const run = await dispatchRule('env_names_list', 'go');
    const value = (await run({
      source:
        'package main\n\nfunc demo() { _ = os.Getenv("DB_HOST"); _, _ = os.LookupEnv("API_KEY") }\n',
      language: 'go',
    })) as string[];

    assert.deepEqual(value, ['API_KEY', 'DB_HOST']);
  });

  it('resolves known go testcase titles rule-language module', async () => {
    const run = await dispatchRule('testcase_titles_list', 'go');
    const value = (await run({
      source:
        'package main\n\nfunc TestDemo(t *testing.T) { t.Run("case-a", func(t *testing.T) {}) }\n',
      language: 'go',
    })) as string[];

    assert.deepEqual(value, ['case-a']);
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
