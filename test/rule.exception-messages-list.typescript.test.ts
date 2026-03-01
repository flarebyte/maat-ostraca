import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { run } from '../src/rules/exception_messages_list/typescript.js';

describe('rule exception_messages_list/typescript', () => {
  it('includes throw new/call/string literal forms and excludes non-literals', async () => {
    const source = [
      'throw new Error("x");',
      "throw new TypeError('y');",
      'throw Error("z");',
      'throw TypeError(`u`);',
      "throw 'w';",
      `throw new Error(${`\`bad \${value}\``});`,
      'throw new Error(prefix + "x");',
      'throw buildError("x");',
    ].join('\n');

    const result = await run({ source, language: 'typescript' });

    assert.deepEqual(result, ['u', 'w', 'x', 'y', 'z']);
  });
});
