import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canonicalStringify } from '../src/core/format/canonical-json.js';
import { run as runInterfaceMap } from '../src/rules/interface_map/go.js';
import { run as runInterfacesCodeMap } from '../src/rules/interfaces_code_map/go.js';

describe('rule interface_map/go + interfaces_code_map/go', () => {
  it('extracts named interfaces, extends, and methods sorted', async () => {
    const source = [
      'package sample',
      '',
      'import (',
      '  "context"',
      '  "io"',
      ')',
      '',
      'type Reader interface {',
      '  Read(p []byte) (int, error)',
      '}',
      '',
      'type PaymentProvider interface {',
      '  io.Closer',
      '  Reader',
      '  Charge(ctx context.Context, req ChargeRequest) (ChargeResponse, error)',
      '  Close() error',
      '}',
      '',
    ].join('\n');

    const mapResult = await runInterfaceMap({ source, language: 'go' });

    assert.deepEqual(Object.keys(mapResult), ['PaymentProvider', 'Reader']);
    assert.deepEqual(mapResult.PaymentProvider, {
      modifiers: [],
      extends: ['io.Closer', 'Reader'],
      methods: [
        'Charge(ctx context.Context, req ChargeRequest) (ChargeResponse, error)',
        'Close() error',
      ],
    });
    assert.deepEqual(mapResult.Reader, {
      modifiers: [],
      extends: [],
      methods: ['Read(p []byte) (int, error)'],
    });
  });

  it('captures exact interface declaration text and preserves formatting', async () => {
    const source = [
      'package sample',
      '',
      'type Reader interface {',
      '\tRead(p []byte) (int, error)',
      '}',
      '',
    ].join('\n');

    const result = await runInterfacesCodeMap({ source, language: 'go' });

    assert.equal(
      result.Reader,
      ['type Reader interface {', '\tRead(p []byte) (int, error)', '}'].join(
        '\n',
      ),
    );
  });

  it('is deterministic across repeated runs', async () => {
    const source = [
      'package sample',
      '',
      'type Reader interface {',
      '  Read(p []byte) (int, error)',
      '}',
      '',
      'type PaymentProvider interface {',
      '  io.Closer',
      '  Reader',
      '  Close() error',
      '}',
      '',
    ].join('\n');

    const first = await runInterfaceMap({ source, language: 'go' });
    const second = await runInterfaceMap({ source, language: 'go' });

    assert.equal(canonicalStringify(first), canonicalStringify(second));
  });
});
