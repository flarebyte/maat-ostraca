import { expect, test } from 'bun:test';
import {
  commonRuleContracts,
  numericFields,
} from '../../test/rule-result-contracts.js';
import * as cli from './helpers.js';

const commonRules = Object.keys(commonRuleContracts).sort();
const matrix = [
  {
    language: 'dart',
    from: 'testdata/dart/determinism/wide-v1.dart',
    to: 'testdata/dart/determinism/wide-v2.dart',
  },
  {
    language: 'rust',
    from: 'testdata/rust/regression/v1.rs',
    to: 'testdata/rust/regression/v2.rs',
  },
];
for (const row of matrix) {
  test(`${row.language}: the same analyse selectors and JSON projections work`, () => {
    const output = cli.parseAnalyseOutput(
      cli.expectSuccess(
        cli.runCli([
          'analyse',
          '--in',
          row.from,
          '--language',
          row.language,
          '--rules',
          commonRules.join(','),
          '--json',
        ]),
      ),
    );
    expect(Object.keys(output.rules).sort()).toEqual(commonRules);
    for (const [name, schema] of Object.entries(commonRuleContracts))
      expect(schema.safeParse(output.rules[name]).success).toBeTrue();
    const functions = commonRuleContracts.function_map.parse(
      output.rules.function_map,
    );
    const methods = commonRuleContracts.method_map.parse(
      output.rules.method_map,
    );
    const io = commonRuleContracts.io_calls_count.parse(
      output.rules.io_calls_count,
    );
    // Equivalent to `.rules.function_map | to_entries | map({key, loc: .value.loc})`.
    const locations = Object.entries(functions).map(([key, value]) => ({
      key,
      loc: value.loc,
    }));
    expect(locations.length).toBeGreaterThan(0);
    expect(
      locations.every(
        (item) => typeof item.key === 'string' && typeof item.loc === 'number',
      ),
    ).toBeTrue();
    for (const [key, value] of Object.entries(methods)) {
      expect(value.ioCallsCount).toBe(io.methods[key]);
      expect(value.ioCallsCount).toBe(
        value.ioReadCallsCount + value.ioWriteCallsCount,
      );
    }
    const interfaces = commonRuleContracts.interface_map.parse(
      output.rules.interface_map,
    );
    const snippets = commonRuleContracts.interfaces_code_map.parse(
      output.rules.interfaces_code_map,
    );
    expect(Object.keys(interfaces).sort()).toEqual(
      Object.keys(snippets).sort(),
    );
    expect(
      Object.values(interfaces)
        .flatMap((value) => value.methods)
        .every((value) => typeof value === 'string'),
    ).toBeTrue();
  });
  for (const deltaOnly of [false, true])
    test(`${row.language}: identical diff queries work with deltaOnly=${deltaOnly}`, () => {
      const args = [
        'diff',
        '--from',
        row.from,
        '--to',
        row.to,
        '--language',
        row.language,
        '--rules',
        commonRules.join(','),
        '--json',
        ...(deltaOnly ? ['--delta-only'] : []),
      ];
      const output = cli.parseDiffOutput(cli.expectSuccess(cli.runCli(args)));
      expect(Object.keys(output.rules).sort()).toEqual(commonRules);
      const metrics = output.rules.file_metrics as Record<string, unknown>;
      expect(Object.keys(metrics).sort()).toEqual(
        Object.keys(numericFields).sort(),
      );
      for (const value of Object.values(metrics)) {
        if (deltaOnly) expect(typeof value).toBe('number');
        else {
          const delta = value as { from: number; to: number; delta: number };
          expect(Object.keys(delta).sort()).toEqual(['delta', 'from', 'to']);
          expect(delta.delta).toBe(delta.to - delta.from);
        }
      }
      for (const name of commonRules.filter((rule) => rule.endsWith('_list'))) {
        const value = output.rules[name] as {
          added: unknown;
          removed: unknown;
        };
        expect(Object.keys(value).sort()).toEqual(['added', 'removed']);
        expect(Array.isArray(value.added)).toBeTrue();
        expect(Array.isArray(value.removed)).toBeTrue();
      }
      for (const name of [
        'function_map',
        'method_map',
        'interface_map',
        'interfaces_code_map',
      ]) {
        const entries = Object.values(
          output.rules[name] as Record<string, { status: string }>,
        );
        expect(entries.length).toBeGreaterThan(0);
        for (const entry of entries)
          expect(['added', 'removed', 'modified', 'unchanged']).toContain(
            entry.status,
          );
      }
      const hash = output.rules.code_hash as { changed: boolean };
      expect(typeof hash.changed).toBe('boolean');
      expect(Object.keys(hash).sort()).toEqual(
        deltaOnly ? ['changed'] : ['changed', 'from', 'to'],
      );
    });
}
