import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  formatError,
  mapErrorToExitCode,
  UsageError,
} from '../src/core/errors/index.js';

describe('error mapping and formatting', () => {
  it('maps UsageError to exit code 2 and formats json envelope when json=true', () => {
    const error = new UsageError('invalid input', { code: 'E_USAGE' });
    const mapped = mapErrorToExitCode(error);
    const formatted = formatError(error, { json: true });

    assert.equal(mapped, 2);
    assert.equal(formatted.exitCode, 2);
    assert.equal(formatted.stderr, undefined);
    assert.equal(
      formatted.stdout,
      '{"error":{"code":"E_USAGE","message":"invalid input"}}\n',
    );
  });

  it('maps unknown errors to exit code 1 and formats json envelope when json=true', () => {
    const mapped = mapErrorToExitCode(new Error('boom'));
    const formatted = formatError(new Error('boom'), { json: true });

    assert.equal(mapped, 1);
    assert.equal(formatted.exitCode, 1);
    assert.equal(formatted.stderr, undefined);
    assert.equal(
      formatted.stdout,
      '{"error":{"code":"E_INTERNAL","message":"internal error"}}\n',
    );
  });
});
