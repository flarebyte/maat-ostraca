import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { run as runImportFilesList } from '../src/rules/import_files_list/dart.js';
import { run } from '../src/rules/package_imports_list/dart.js';

const readFixture = (path: string): string => {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
};

describe('rule package_imports_list/dart', () => {
  it('includes package:flutter/material.dart', async () => {
    const source = "import 'package:flutter/material.dart';\n";

    const result = await run({ source, language: 'dart' });

    assert.deepEqual(result, ['package:flutter/material.dart']);
  });

  it('includes package:my_app/foo.dart', async () => {
    const source = "import 'package:my_app/foo.dart';\n";

    const result = await run({ source, language: 'dart' });

    assert.deepEqual(result, ['package:my_app/foo.dart']);
  });

  it('excludes dart: imports', async () => {
    const source = "import 'dart:io';\n";

    const result = await run({ source, language: 'dart' });

    assert.deepEqual(result, []);
  });

  it('excludes relative imports like ./local.dart', async () => {
    const source = "import './local.dart';\nimport '../shared.dart';\n";

    const result = await run({ source, language: 'dart' });

    assert.deepEqual(result, []);
  });

  it('ignores aliases and combinators and returns only uris', async () => {
    const source = readFixture('../testdata/dart/imports/analyse.dart');

    const result = await run({ source, language: 'dart' });

    assert.deepEqual(result, [
      'package:collection/collection.dart',
      'package:flutter/material.dart',
      'package:flutter/widgets.dart',
      'package:my_app/foo.dart',
    ]);
  });

  it('dedupes and sorts', async () => {
    const source = [
      "import 'package:my_app/foo.dart';",
      "import 'dart:io';",
      "import 'package:flutter/material.dart';",
      "import 'package:my_app/foo.dart';",
      "import './local.dart';",
      '',
    ].join('\n');

    const result = await run({ source, language: 'dart' });

    assert.deepEqual(result, [
      'package:flutter/material.dart',
      'package:my_app/foo.dart',
    ]);
  });

  it('keeps import_files_list output unchanged for the shared dart fixture', async () => {
    const source = readFixture('../testdata/dart/imports/analyse.dart');

    const result = await runImportFilesList({ source, language: 'dart' });

    assert.deepEqual(result, [
      './local.dart',
      'dart:io',
      'package:collection/collection.dart',
      'package:flutter/material.dart',
      'package:flutter/widgets.dart',
      'package:my_app/foo.dart',
    ]);
  });
});
