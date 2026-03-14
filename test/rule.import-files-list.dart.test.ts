import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { canonicalStringify } from '../src/core/format/canonical-json.js';
import { runAnalyse } from '../src/core/run-analyse.js';
import { run } from '../src/rules/import_files_list/dart.js';

const readFixture = (path: string): string => {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
};

describe('rule import_files_list/dart', () => {
  it('extracts dart: imports', async () => {
    const source = "import 'dart:io';\n";

    const result = await run({ source, language: 'dart' });

    assert.deepEqual(result, ['dart:io']);
  });

  it('extracts package: imports', async () => {
    const source = readFixture('../testdata/dart/imports/packages.dart');

    const result = await run({ source, language: 'dart' });

    assert.deepEqual(result, [
      'package:collection/collection.dart',
      'package:flutter/material.dart',
      'package:flutter/widgets.dart',
      'package:my_app/foo.dart',
    ]);
  });

  it('extracts relative imports', async () => {
    const source = 'import \'./local.dart\';\nimport "../shared.dart";\n';

    const result = await run({ source, language: 'dart' });

    assert.deepEqual(result, ['../shared.dart', './local.dart']);
  });

  it('ignores aliases and combinators and returns only uris', async () => {
    const source = readFixture('../testdata/dart/imports/combinators.dart');

    const result = await run({ source, language: 'dart' });

    assert.deepEqual(result, [
      'package:collection/collection.dart',
      'package:flutter/widgets.dart',
    ]);
  });

  it('dedupes and sorts', async () => {
    const source = [
      "import './local.dart';",
      "import 'dart:io';",
      'import "./local.dart";',
      "import 'package:flutter/material.dart';",
      "import 'dart:io';",
      '',
    ].join('\n');

    const result = await run({ source, language: 'dart' });

    assert.deepEqual(result, [
      './local.dart',
      'dart:io',
      'package:flutter/material.dart',
    ]);
  });

  it('is deterministic across repeated runs with canonical json bytes', async () => {
    const source = readFixture('../testdata/dart/imports/analyse.dart');

    const first = await runAnalyse({
      filename: 'testdata/dart/imports/analyse.dart',
      source,
      language: 'dart',
      rules: ['import_files_list'],
    });
    const second = await runAnalyse({
      filename: 'testdata/dart/imports/analyse.dart',
      source,
      language: 'dart',
      rules: ['import_files_list'],
    });

    assert.equal(canonicalStringify(first), canonicalStringify(second));
  });
});
