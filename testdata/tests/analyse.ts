import { describe, it, test } from 'node:test';

const dynamicTitle = 'dynamic';

describe('auth suite', () => {
  it('logs in', () => {});
  it.only('logs out', () => {});
  it.skip(`resets password`, () => {});
});

test('stores token', () => {});
test.only('refreshes token', () => {});
test.skip(`revokes token`, () => {});

describe.only('payments suite', () => {
  test('charges card', () => {});
});

describe.skip(`shipping suite`, () => {
  it('creates label', () => {});
});

describe(dynamicTitle, () => {});
it(`x${dynamicTitle}`, () => {});
test(`bad ${dynamicTitle}`, () => {});
