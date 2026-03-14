import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { UsageError } from '../src/core/errors/index.js';
import { dispatchRule } from '../src/rules/dispatch.js';

describe('rules.dispatch', () => {
  it('resolves known dart rule-language module', async () => {
    const run = await dispatchRule('import_files_list', 'dart');
    const value = (await run({
      source: "import 'dart:io';\n",
      language: 'dart',
    })) as string[];

    assert.deepEqual(value, ['dart:io']);
  });

  it('resolves known dart package import rule-language module', async () => {
    const run = await dispatchRule('package_imports_list', 'dart');
    const value = (await run({
      source: "import 'dart:io';\nimport 'package:flutter/material.dart';\n",
      language: 'dart',
    })) as string[];

    assert.deepEqual(value, ['package:flutter/material.dart']);
  });

  it('resolves known dart file metrics rule-language module', async () => {
    const run = await dispatchRule('file_metrics', 'dart');
    const value = (await run({
      source: 'void main() {\n  print(1);\n}\n',
      language: 'dart',
    })) as { loc: number; sloc: number };

    assert.equal(value.loc, 4);
    assert.equal(value.sloc, 3);
  });

  it('resolves known dart code hash rule-language module', async () => {
    const run = await dispatchRule('code_hash', 'dart');
    const value = (await run({
      source: 'void main() {}\n',
      language: 'dart',
    })) as { algorithm: string; file: string };

    assert.equal(value.algorithm, 'sha256');
    assert.equal(
      value.file,
      '12e3f0ab9f3e6b936c95dcfe87f4f506f6b2e3108281ea220ce1e0360cfe739a',
    );
  });

  it('resolves known dart function map rule-language module', async () => {
    const run = await dispatchRule('function_map', 'dart');
    const value = (await run({
      source: 'Future<void> boot() async {}\n',
      language: 'dart',
    })) as Record<string, { modifiers: string[]; returns: string[] }>;

    assert.deepEqual(value, {
      boot: {
        modifiers: ['async'],
        params: [],
        returns: ['Future<void>'],
      },
    });
  });

  it('resolves known dart method map rule-language module', async () => {
    const run = await dispatchRule('method_map', 'dart');
    const value = (await run({
      source: 'class PaymentService { static external String helper(); }\n',
      language: 'dart',
    })) as Record<
      string,
      { receiver: string; name: string; params: string[]; returns: string[] }
    >;

    assert.deepEqual(value, {
      paymentServiceHelper: {
        modifiers: ['external', 'static'],
        receiver: 'PaymentService',
        name: 'helper',
        params: [],
        returns: ['String'],
      },
    });
  });

  it('resolves known dart class map rule-language module', async () => {
    const run = await dispatchRule('class_map', 'dart');
    const value = (await run({
      source:
        'abstract class PaymentService extends BaseService implements Logger { void charge() {} }\n',
      language: 'dart',
    })) as Record<string, { modifiers: string[]; methodCount: number }>;

    assert.deepEqual(value, {
      PaymentService: {
        modifiers: ['abstract'],
        extends: 'BaseService',
        implements: ['Logger'],
        methodCount: 1,
      },
    });
  });

  it('resolves known dart interface map rule-language module', async () => {
    const run = await dispatchRule('interface_map', 'dart');
    const value = (await run({
      source:
        'abstract class Reader implements Logger { String read(String id); void write(String id); }\nclass Worker {}\n',
      language: 'dart',
    })) as Record<string, { extends: string[]; methods: string[] }>;

    assert.deepEqual(value, {
      Reader: {
        modifiers: ['abstract'],
        extends: ['Logger'],
        methods: ['String read(String id)', 'void write(String id)'],
      },
    });
  });

  it('resolves known dart interfaces code map rule-language module', async () => {
    const run = await dispatchRule('interfaces_code_map', 'dart');
    const value = (await run({
      source:
        'abstract class Reader {\n  String read(String id);\n}\nclass Worker {}\n',
      language: 'dart',
    })) as Record<string, string>;

    assert.equal(
      value.Reader,
      'abstract class Reader {\n  String read(String id);\n}',
    );
  });

  it('resolves known dart io count rule-language modules', async () => {
    const runAll = await dispatchRule('io_calls_count', 'dart');
    const runRead = await dispatchRule('io_read_calls_count', 'dart');
    const runWrite = await dispatchRule('io_write_calls_count', 'dart');
    const source = [
      "Future<void> load() async { await File('a').readAsString(); print('ok'); }",
      '',
    ].join('\n');

    const all = (await runAll({
      source,
      language: 'dart',
    })) as { functions: Record<string, number> };
    const read = (await runRead({
      source,
      language: 'dart',
    })) as { functions: Record<string, number> };
    const write = (await runWrite({
      source,
      language: 'dart',
    })) as { functions: Record<string, number> };

    assert.deepEqual(all.functions, { load: 2 });
    assert.deepEqual(read.functions, { load: 1 });
    assert.deepEqual(write.functions, { load: 1 });
  });

  it('resolves known dart message rule-language modules', async () => {
    const runError = await dispatchRule('error_messages_list', 'dart');
    const runException = await dispatchRule('exception_messages_list', 'dart');
    const source =
      'void demo() { throw Exception("x"); print("y"); throw err; }\n';

    const errorMessages = (await runError({
      source,
      language: 'dart',
    })) as string[];
    const exceptionMessages = (await runException({
      source,
      language: 'dart',
    })) as string[];

    assert.deepEqual(errorMessages, ['x', 'y']);
    assert.deepEqual(exceptionMessages, ['x']);
  });

  it('resolves known dart env names rule-language module', async () => {
    const run = await dispatchRule('env_names_list', 'dart');
    const value = (await run({
      source:
        'void demo() { Platform.environment["DB_HOST"]; Platform.environment.containsKey(\'API_KEY\'); }\n',
      language: 'dart',
    })) as string[];

    assert.deepEqual(value, ['API_KEY', 'DB_HOST']);
  });

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
