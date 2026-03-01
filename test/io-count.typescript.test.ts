import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { countIoBySymbol } from '../src/rules/_shared/typescript/io_count.js';

describe('typescript io counting', () => {
  it('discovers function and method keys deterministically', async () => {
    const source = [
      'export function chargeCustomer() { fs.readFileSync("a"); }',
      'const loadLedger = () => { fetch("/x"); };',
      'const saveLedger = function () { fs.writeFileSync("b", "x"); };',
      'class PaymentService {',
      '  Charge() { axios.post("/c", {}); }',
      "  ['computed']() { axios.get('/ignored'); }",
      '}',
    ].join('\n');

    const output = await countIoBySymbol(source, 'typescript', 'all');

    assert.deepEqual(Object.keys(output.functions), [
      'chargeCustomer',
      'loadLedger',
      'saveLedger',
    ]);
    assert.deepEqual(Object.keys(output.methods), ['paymentServiceCharge']);
  });

  it('counts read/write patterns and io_calls equals read+write per symbol', async () => {
    const source = [
      'function alpha() {',
      '  fs.readFileSync("a");',
      '  fetch("/items");',
      '  axios.post("/items", {});',
      '}',
      'const beta = () => {',
      '  axios.get("/g");',
      '  process.stdout.write("ok");',
      '};',
      'class Store {',
      '  Save() {',
      '    fs.promises.readFile("a");',
      '    fs.writeFileSync("b", "c");',
      '    axios.patch("/p", {});',
      '  }',
      '}',
    ].join('\n');

    const allCounts = await countIoBySymbol(source, 'typescript', 'all');
    const readCounts = await countIoBySymbol(source, 'typescript', 'read');
    const writeCounts = await countIoBySymbol(source, 'typescript', 'write');

    assert.deepEqual(readCounts.functions, {
      alpha: 2,
      beta: 1,
    });
    assert.deepEqual(writeCounts.functions, {
      alpha: 1,
      beta: 1,
    });
    assert.deepEqual(readCounts.methods, {
      storeSave: 1,
    });
    assert.deepEqual(writeCounts.methods, {
      storeSave: 2,
    });

    for (const key of Object.keys(allCounts.functions)) {
      assert.equal(
        allCounts.functions[key],
        readCounts.functions[key] + writeCounts.functions[key],
      );
    }
    for (const key of Object.keys(allCounts.methods)) {
      assert.equal(
        allCounts.methods[key],
        readCounts.methods[key] + writeCounts.methods[key],
      );
    }
  });

  it('returns sorted keys', async () => {
    const source = [
      'const zeta = () => { fetch("/z"); };',
      'const alpha = () => { fetch("/a"); };',
      'class A { b() { fetch("/b"); } }',
      'class Z { a() { fetch("/za"); } }',
    ].join('\n');

    const output = await countIoBySymbol(source, 'typescript', 'read');

    assert.deepEqual(Object.keys(output.functions), ['alpha', 'zeta']);
    assert.deepEqual(Object.keys(output.methods), ['ab', 'za']);
  });
});
