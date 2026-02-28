import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { listTypeScriptModuleSpecifiers } from '../src/rules/_shared/typescript/import_specifiers.js';

describe('typescript import/export specifier helper', () => {
  it('returns all module specifiers from mixed import/export forms', async () => {
    const source = [
      'import React from "react";',
      'import type { T } from "./types";',
      'import "@scope/pkg";',
      'export { x } from "lodash/fp";',
      'export * from "../rel";',
      'export { y };',
    ].join('\n');

    const result = await listTypeScriptModuleSpecifiers(source, 'typescript');

    assert.deepEqual(result, [
      '../rel',
      './types',
      '@scope/pkg',
      'lodash/fp',
      'react',
    ]);
  });

  it('is deterministic across repeated runs', async () => {
    const source = [
      'export * from "pkg-b";',
      'import "pkg-a";',
      'import x from "pkg-c";',
    ].join('\n');

    const first = await listTypeScriptModuleSpecifiers(source, 'typescript');
    const second = await listTypeScriptModuleSpecifiers(source, 'typescript');

    assert.deepEqual(first, second);
  });
});
