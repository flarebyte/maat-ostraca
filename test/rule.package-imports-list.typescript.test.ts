import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { run } from '../src/rules/package_imports_list/typescript.js';

describe('rule package_imports_list/typescript', () => {
  it('includes only external package imports and excludes local/file imports', async () => {
    const source = [
      'import React from "react";',
      'import lib from "lodash/fp";',
      'import "@scope/pkg";',
      'import x from "./local";',
      'import y from "../x";',
      'import z from "/abs";',
      'import q from "file:./x";',
      'export * from "@scope/pkg";',
      'export { t } from "@scope/pkg/utils";',
    ].join('\n');

    const result = await run({ source, language: 'typescript' });

    assert.deepEqual(result, [
      '@scope/pkg',
      '@scope/pkg/utils',
      'lodash/fp',
      'react',
    ]);
  });

  it('dedupes and sorts deterministically', async () => {
    const source = [
      'import x from "react";',
      'export * from "react";',
      'import y from "@scope/pkg";',
      'import z from "@scope/pkg";',
    ].join('\n');

    const result = await run({ source, language: 'typescript' });

    assert.deepEqual(result, ['@scope/pkg', 'react']);
  });
});
