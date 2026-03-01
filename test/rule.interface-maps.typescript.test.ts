import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { run as runInterfaceMap } from '../src/rules/interface_map/typescript.js';
import { run as runInterfacesCodeMap } from '../src/rules/interfaces_code_map/typescript.js';

describe('rule interface_map/typescript + interfaces_code_map/typescript', () => {
  it('extracts extends and methods sorted and returns interface code snippets', async () => {
    const source = [
      'export interface Chargeable extends B, A {',
      '  log(message: string): void;',
      '  charge(amount: number): Promise<void>;',
      '}',
      'interface Worker {',
      '  run(): void;',
      '}',
    ].join('\n');

    const mapResult = await runInterfaceMap({ source, language: 'typescript' });
    const codeResult = await runInterfacesCodeMap({
      source,
      language: 'typescript',
    });

    assert.deepEqual(Object.keys(mapResult), ['Chargeable', 'Worker']);
    assert.deepEqual(mapResult.Chargeable, {
      modifiers: ['export'],
      extends: ['A', 'B'],
      methods: [
        'charge(amount: number): Promise<void>',
        'log(message: string): void',
      ],
    });
    assert.deepEqual(mapResult.Worker, {
      modifiers: [],
      extends: [],
      methods: ['run(): void'],
    });

    assert.equal(Object.keys(codeResult)[0], 'Chargeable');
    assert.ok(codeResult.Chargeable.includes('interface Chargeable'));
    assert.ok(
      codeResult.Chargeable.includes('charge(amount: number): Promise<void>;'),
    );
    assert.ok(codeResult.Worker.includes('interface Worker'));
  });
});
