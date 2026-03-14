import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type {
  AnalyseOutput,
  DiffOutput,
  RulesListOutput,
} from '../src/core/contracts/outputs.js';
import { formatHumanAnalyse } from '../src/core/format/human/analyse.js';
import { formatHumanDiff } from '../src/core/format/human/diff.js';
import { formatHumanRules } from '../src/core/format/human/rules.js';

describe('human formatter', () => {
  it('renders rules in deterministic sorted order', () => {
    const output: RulesListOutput = {
      language: 'typescript',
      rules: [
        {
          name: 'file_metrics',
          description: 'Collect basic per-file metric counters.',
        },
        {
          name: 'code_hash',
          description: 'Compute deterministic code-level content hash.',
        },
      ],
    };

    const first = formatHumanRules(output);
    const second = formatHumanRules(output);

    assert.equal(
      first,
      [
        'Language: typescript',
        'Rules:',
        '- code_hash: Compute deterministic code-level content hash.',
        '- file_metrics: Collect basic per-file metric counters.',
        '',
      ].join('\n'),
    );
    assert.equal(first, second);
  });

  it('renders analyse output deterministically for list, map, and scalar rules', () => {
    const output: AnalyseOutput = {
      filename: 'testdata/go/imports/analyse.go',
      language: 'go',
      rules: {
        import_files_list: ['fmt', 'os'],
        method_map: {
          paymentServiceCharge: {
            modifiers: [],
            receiver: 'PaymentService',
            name: 'Charge',
            params: ['ctx context.Context'],
            returns: ['error'],
          },
        },
        file_metrics: {
          loc: 3,
          sloc: 2,
          tokens: 8,
          loops: 0,
          conditions: 0,
          cyclomaticComplexity: 1,
          cognitiveComplexity: 1,
          maxNestingDepth: 0,
        },
      },
    };

    const first = formatHumanAnalyse(output);
    const second = formatHumanAnalyse(output);

    assert.equal(
      first,
      [
        'File: testdata/go/imports/analyse.go',
        'Language: go',
        '',
        '[file_metrics]',
        'cognitiveComplexity: 1',
        'conditions: 0',
        'cyclomaticComplexity: 1',
        'loc: 3',
        'loops: 0',
        'maxNestingDepth: 0',
        'sloc: 2',
        'tokens: 8',
        '',
        '[import_files_list]',
        '- fmt',
        '- os',
        '',
        '[method_map]',
        'paymentServiceCharge: modifiers=[], name="Charge", params=["ctx context.Context"], receiver="PaymentService", returns=["error"]',
        '',
      ].join('\n'),
    );
    assert.equal(first, second);
  });

  it('renders diff output deterministically for list and numeric deltas', () => {
    const output: DiffOutput = {
      from: { filename: 'testdata/dart/metrics/v1.dart', language: 'dart' },
      to: { filename: 'testdata/dart/metrics/v2.dart', language: 'dart' },
      rules: {
        file_metrics: {
          loc: { from: 5, to: 8, delta: 3 },
          tokens: { from: 10, to: 15, delta: 5 },
        },
        import_files_list: {
          added: ['package:flutter/material.dart'],
          removed: ['./local.dart'],
        },
      },
    };

    const first = formatHumanDiff(output);
    const second = formatHumanDiff(output);

    assert.equal(
      first,
      [
        'From: testdata/dart/metrics/v1.dart',
        'To: testdata/dart/metrics/v2.dart',
        'Language: dart',
        '',
        '[file_metrics]',
        'loc: 5 -> 8 (delta 3)',
        'tokens: 10 -> 15 (delta 5)',
        '',
        '[import_files_list]',
        'Added:',
        '+ package:flutter/material.dart',
        'Removed:',
        '- ./local.dart',
        '',
      ].join('\n'),
    );
    assert.equal(first, second);
  });

  it('renders delta-only diff compactly and deterministically', () => {
    const output: DiffOutput = {
      from: { filename: 'from.go', language: 'go' },
      to: { filename: 'to.go', language: 'go' },
      deltaOnly: true,
      rules: {
        code_hash: { changed: true },
        file_metrics: {
          loc: 2,
          loops: 1,
        },
      },
    };

    const first = formatHumanDiff(output);
    const second = formatHumanDiff(output);

    assert.equal(
      first,
      [
        'From: from.go',
        'To: to.go',
        'Language: go',
        'Delta only: true',
        '',
        '[code_hash]',
        'changed: true',
        '',
        '[file_metrics]',
        'loc: delta 2',
        'loops: delta 1',
        '',
      ].join('\n'),
    );
    assert.equal(first, second);
  });
});
