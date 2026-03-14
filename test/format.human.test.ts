import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type {
  AnalyseOutput,
  DiffOutput,
  RulesListOutput,
} from '../src/core/contracts/outputs.js';
import { formatHumanAnalyse } from '../src/core/format/human/analyse.js';
import {
  colorDelta,
  colorDiffStatus,
  colorRuleName,
  colorSection,
  createHumanFormatStyle,
  supportsHumanColor,
} from '../src/core/format/human/color.js';
import { formatHumanDiff } from '../src/core/format/human/diff.js';
import { formatHumanRules } from '../src/core/format/human/rules.js';

describe('human formatter', () => {
  it('color helper wraps text only when enabled', () => {
    const enabled = createHumanFormatStyle(true);
    const disabled = createHumanFormatStyle(false);

    assert.equal(colorRuleName('code_hash', disabled), 'code_hash');
    assert.equal(
      colorRuleName('code_hash', enabled),
      '\u001B[1mcode_hash\u001B[22m',
    );
    assert.equal(
      colorSection('[code_hash]', enabled),
      '\u001B[36m\u001B[1m[code_hash]\u001B[22m\u001B[39m',
    );
    assert.equal(
      colorDiffStatus('added', enabled),
      '\u001B[32madded\u001B[39m',
    );
    assert.equal(colorDelta('+3', enabled), '\u001B[32m+3\u001B[39m');
  });

  it('detects color support deterministically from tty and env', () => {
    assert.equal(
      supportsHumanColor({ isTTY: false, env: { TERM: 'xterm-256color' } }),
      false,
    );
    assert.equal(
      supportsHumanColor({
        isTTY: true,
        env: { NO_COLOR: '1', TERM: 'xterm-256color' },
      }),
      false,
    );
    assert.equal(
      supportsHumanColor({ isTTY: true, env: { TERM: 'xterm-256color' } }),
      true,
    );
  });

  it('renders rules in deterministic sorted order', () => {
    const style = createHumanFormatStyle(false);
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

    const first = formatHumanRules(output, style);
    const second = formatHumanRules(output, style);

    assert.equal(
      first,
      [
        'Language: typescript',
        'Rules:',
        '  - code_hash: Compute deterministic code-level content hash.',
        '  - file_metrics: Collect basic per-file metric counters.',
        '',
      ].join('\n'),
    );
    assert.equal(first, second);
  });

  it('renders analyse output deterministically for list, map, and scalar rules', () => {
    const style = createHumanFormatStyle(false);
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

    const first = formatHumanAnalyse(output, style);
    const second = formatHumanAnalyse(output, style);

    assert.equal(
      first,
      [
        'File: testdata/go/imports/analyse.go',
        'Language: go',
        '',
        '[file_metrics]',
        '  cognitiveComplexity: 1',
        '  conditions: 0',
        '  cyclomaticComplexity: 1',
        '  loc: 3',
        '  loops: 0',
        '  maxNestingDepth: 0',
        '  sloc: 2',
        '  tokens: 8',
        '',
        '[import_files_list]',
        '  - fmt',
        '  - os',
        '',
        '[method_map]',
        '  paymentServiceCharge: modifiers=[], name="Charge", params=["ctx context.Context"], receiver="PaymentService", returns=["error"]',
        '',
      ].join('\n'),
    );
    assert.equal(first, second);
  });

  it('renders diff output deterministically for list and numeric deltas', () => {
    const style = createHumanFormatStyle(false);
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

    const first = formatHumanDiff(output, style);
    const second = formatHumanDiff(output, style);

    assert.equal(
      first,
      [
        'From: testdata/dart/metrics/v1.dart',
        'To: testdata/dart/metrics/v2.dart',
        'Language: dart',
        '',
        '[file_metrics]',
        '  loc: 5 -> 8 (delta +3)',
        '  tokens: 10 -> 15 (delta +5)',
        '',
        '[import_files_list]',
        '  Added:',
        '    + package:flutter/material.dart',
        '  Removed:',
        '    - ./local.dart',
        '',
      ].join('\n'),
    );
    assert.equal(first, second);
  });

  it('renders delta-only diff compactly and deterministically', () => {
    const style = createHumanFormatStyle(false);
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

    const first = formatHumanDiff(output, style);
    const second = formatHumanDiff(output, style);

    assert.equal(
      first,
      [
        'From: from.go',
        'To: to.go',
        'Language: go',
        'Delta only: true',
        '',
        '[code_hash]',
        '  changed: true',
        '',
        '[file_metrics]',
        '  loc: delta +2',
        '  loops: delta +1',
        '',
      ].join('\n'),
    );
    assert.equal(first, second);
  });

  it('renders colorized output when enabled', () => {
    const style = createHumanFormatStyle(true);
    const output: DiffOutput = {
      from: { filename: 'from.go', language: 'go' },
      to: { filename: 'to.go', language: 'go' },
      rules: {
        method_map: {
          paymentServiceCharge: {
            status: 'modified',
            loc: { from: 3, to: 5, delta: 2 },
          },
        },
      },
    };

    const rendered = formatHumanDiff(output, style);

    assert.equal(
      rendered,
      [
        'From: from.go',
        'To: to.go',
        'Language: go',
        '',
        '\u001B[36m\u001B[1m[\u001B[1mmethod_map\u001B[22m]\u001B[22m\u001B[39m',
        '  paymentServiceCharge: \u001B[33mmodified\u001B[39m, loc=3 -> 5 (delta \u001B[32m+2\u001B[39m)',
        '',
      ].join('\n'),
    );
  });
});
