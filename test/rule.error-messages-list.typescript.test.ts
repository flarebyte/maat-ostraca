import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { run } from '../src/rules/error_messages_list/typescript.js';

describe('rule error_messages_list/typescript', () => {
  it('includes explicit error reporting calls and excludes non-literals', async () => {
    const source = [
      'console.error("x");',
      "logger.error('y');",
      'ctx.logger.error(`z`);',
      'console.error(err);',
      'logger.error(prefix + "x");',
      `ctx.logger.error(${`\`no \${expr}\``});`,
      'other.error("ignored");',
    ].join('\n');

    const result = await run({ source, language: 'typescript' });

    assert.deepEqual(result, ['x', 'y', 'z']);
  });
});
