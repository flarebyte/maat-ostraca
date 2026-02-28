import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createCli } from '../src/cli.mts';

describe('cli', () => {
  it('prints hello world by default', async () => {
    const log = mock.method(console, 'log', () => {});

    await createCli().parseAsync(['node', 'maat']);

    assert.equal(log.mock.calls.length, 1);
    assert.deepEqual(log.mock.calls[0]?.arguments, ['Hello, world!']);
    log.mock.restore();
  });

  it('prints hello with provided name', async () => {
    const log = mock.method(console, 'log', () => {});

    await createCli().parseAsync(['node', 'maat', '--name', 'Olivier']);

    assert.equal(log.mock.calls.length, 1);
    assert.deepEqual(log.mock.calls[0]?.arguments, ['Hello, Olivier!']);
    log.mock.restore();
  });
});
