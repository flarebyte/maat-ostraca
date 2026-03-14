import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type {
  AnalyseOutput,
  DiffOutput,
  RulesListOutput,
} from '../src/core/contracts/outputs.js';
import { formatHumanAnalyse } from '../src/core/format/human/analyse.js';
import {
  formatHumanAnalyseSummary,
  summarizeAnalyseRule,
} from '../src/core/format/human/analyse_summary.js';
import {
  colorDelta,
  colorDiffStatus,
  colorRuleName,
  colorSection,
  createHumanFormatStyle,
  supportsHumanColor,
} from '../src/core/format/human/color.js';
import { formatHumanDiff } from '../src/core/format/human/diff.js';
import {
  formatHumanDiffSummary,
  summarizeDiffRule,
} from '../src/core/format/human/diff_summary.js';
import {
  getRuleFamily,
  RULE_FAMILY_ORDER,
} from '../src/core/format/human/rule_families.js';
import { formatHumanRules } from '../src/core/format/human/rules.js';
import {
  MAX_LIST_ITEMS_DISPLAY,
  MAX_MAP_ENTRIES_DISPLAY,
  summarizeListLines,
  summarizeMapLines,
} from '../src/core/format/human/summary.js';

describe('human formatter', () => {
  it('summary helper renders short lists fully', () => {
    assert.deepEqual(summarizeListLines(['a', 'b'], 'items'), ['a', 'b']);
  });

  it('summary helper renders long lists with count and truncation', () => {
    const entries = Array.from(
      { length: 12 },
      (_, index) => `item-${index + 1}`,
    );
    assert.deepEqual(summarizeListLines(entries, 'items'), [
      'Count: 12 items total',
      ...entries.slice(0, MAX_LIST_ITEMS_DISPLAY),
      '... and 2 more',
    ]);
  });

  it('summary helper renders short maps fully', () => {
    assert.deepEqual(summarizeMapLines(['a: one', 'b: two']), [
      'a: one',
      'b: two',
    ]);
  });

  it('summary helper renders long maps with count and truncation', () => {
    const entries = Array.from(
      { length: 12 },
      (_, index) => `entry-${index + 1}: value`,
    );
    assert.deepEqual(summarizeMapLines(entries), [
      'Count: 12 entries total',
      ...entries.slice(0, MAX_MAP_ENTRIES_DISPLAY),
      '... and 2 more',
    ]);
  });

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

  it('maps known rules to their expected families', () => {
    assert.equal(getRuleFamily('import_files_list'), 'imports');
    assert.equal(getRuleFamily('function_map'), 'symbols');
    assert.equal(getRuleFamily('code_hash'), 'metrics');
    assert.equal(getRuleFamily('io_calls_count'), 'io');
    assert.equal(getRuleFamily('error_messages_list'), 'messages');
    assert.equal(getRuleFamily('env_names_list'), 'environment');
    assert.equal(getRuleFamily('testcase_titles_list'), 'tests');
  });

  it('renders rules grouped into deterministic family sections', () => {
    const style = createHumanFormatStyle(false);
    const output: RulesListOutput = {
      language: 'typescript',
      rules: [
        {
          name: 'code_hash',
          description: 'Compute deterministic code-level content hash.',
        },
        {
          name: 'file_metrics',
          description: 'Collect basic per-file metric counters.',
        },
        {
          name: 'function_map',
          description: 'Map function declarations and signatures.',
        },
        {
          name: 'import_files_list',
          description: 'List imported files by module path.',
        },
      ],
    };

    const first = formatHumanRules(output, style);
    const second = formatHumanRules(output, style);

    assert.equal(
      first,
      [
        'Language: typescript',
        '',
        'Imports',
        '  - import_files_list: List imported files by module path.',
        '',
        'Symbols',
        '  - function_map: Map function declarations and signatures.',
        '',
        'Metrics',
        '  - code_hash: Compute deterministic code-level content hash.',
        '  - file_metrics: Collect basic per-file metric counters.',
        '',
      ].join('\n'),
    );
    assert.equal(first, second);
  });

  it('omits empty families and keeps family order fixed', () => {
    const style = createHumanFormatStyle(false);
    const output: RulesListOutput = {
      language: 'go',
      rules: [
        {
          name: 'io_write_calls_count',
          description: 'Count IO write call sites.',
        },
        {
          name: 'env_names_list',
          description: 'List environment variable names accessed by code.',
        },
      ],
    };

    assert.equal(
      formatHumanRules(output, style),
      [
        'Language: go',
        '',
        'IO',
        '  - io_write_calls_count: Count IO write call sites.',
        '',
        'Environment',
        '  - env_names_list: List environment variable names accessed by code.',
        '',
      ].join('\n'),
    );
    assert.deepEqual(RULE_FAMILY_ORDER, [
      'imports',
      'symbols',
      'metrics',
      'io',
      'messages',
      'environment',
      'tests',
    ]);
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
        'Rules: 3',
        '',
        'Summary',
        '  file_metrics: loc=3, tokens=8',
        '  import_files_list: 2 items',
        '  method_map: 1 entries',
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

  it('renders analyse output summaries for long list and map sections', () => {
    const style = createHumanFormatStyle(false);
    const output: AnalyseOutput = {
      filename: 'summary.go',
      language: 'go',
      rules: {
        function_map: Object.fromEntries(
          Array.from({ length: 12 }, (_, index) => [
            `func${String(index + 1).padStart(2, '0')}`,
            { modifiers: [], params: [], returns: [] },
          ]),
        ),
        import_files_list: Array.from(
          { length: 12 },
          (_, index) => `pkg/${String(index + 1).padStart(2, '0')}`,
        ),
      },
    };

    assert.equal(
      formatHumanAnalyse(output, style),
      [
        'File: summary.go',
        'Language: go',
        'Rules: 2',
        '',
        'Summary',
        '  function_map: 12 entries',
        '  import_files_list: 12 items',
        '',
        '[function_map]',
        '  Count: 12 entries total',
        '  func01: modifiers=[], params=[], returns=[]',
        '  func02: modifiers=[], params=[], returns=[]',
        '  func03: modifiers=[], params=[], returns=[]',
        '  func04: modifiers=[], params=[], returns=[]',
        '  func05: modifiers=[], params=[], returns=[]',
        '  func06: modifiers=[], params=[], returns=[]',
        '  func07: modifiers=[], params=[], returns=[]',
        '  func08: modifiers=[], params=[], returns=[]',
        '  func09: modifiers=[], params=[], returns=[]',
        '  func10: modifiers=[], params=[], returns=[]',
        '  ... and 2 more',
        '',
        '[import_files_list]',
        '  Count: 12 items total',
        '  - pkg/01',
        '  - pkg/02',
        '  - pkg/03',
        '  - pkg/04',
        '  - pkg/05',
        '  - pkg/06',
        '  - pkg/07',
        '  - pkg/08',
        '  - pkg/09',
        '  - pkg/10',
        '  ... and 2 more',
        '',
      ].join('\n'),
    );
  });

  it('summarizes analyse list rules deterministically', () => {
    assert.equal(
      summarizeAnalyseRule('import_files_list', ['a', 'b', 'c']),
      'import_files_list: 3 items',
    );
  });

  it('summarizes analyse map rules deterministically', () => {
    assert.equal(
      summarizeAnalyseRule('function_map', {
        alpha: { modifiers: [], params: [], returns: [] },
        beta: { modifiers: [], params: [], returns: [] },
      }),
      'function_map: 2 entries',
    );
  });

  it('summarizes analyse metrics with a stable subset', () => {
    assert.equal(
      summarizeAnalyseRule('file_metrics', {
        loc: 12,
        sloc: 10,
        tokens: 48,
      }),
      'file_metrics: loc=12, tokens=48',
    );
    assert.equal(
      summarizeAnalyseRule('file_metrics', {
        cyclomaticComplexity: 3,
      }),
      'file_metrics: metrics',
    );
  });

  it('summarizes analyse hash rules by algorithm name', () => {
    assert.equal(
      summarizeAnalyseRule('code_hash', {
        algorithm: 'sha256',
        file: 'abc123',
      }),
      'code_hash: sha256',
    );
  });

  it('falls back to a stable generic analyse object summary', () => {
    assert.equal(
      summarizeAnalyseRule('io_calls_count', {
        functions: {},
        methods: {},
      }),
      'io_calls_count: object',
    );
  });

  it('renders analyse summary before detailed sections in sorted rule order', () => {
    const style = createHumanFormatStyle(false);
    const output: AnalyseOutput = {
      filename: 'from.ts',
      language: 'typescript',
      rules: {
        import_files_list: ['alpha', 'beta'],
        code_hash: { algorithm: 'sha256', file: 'deadbeef' },
        file_metrics: { loc: 4, tokens: 9 },
      },
    };

    assert.deepEqual(formatHumanAnalyseSummary(output, style), [
      'Summary',
      '  code_hash: sha256',
      '  file_metrics: loc=4, tokens=9',
      '  import_files_list: 2 items',
    ]);

    const rendered = formatHumanAnalyse(output, style);
    assert.ok(rendered.indexOf('Summary') < rendered.indexOf('[code_hash]'));
    assert.ok(
      rendered.indexOf('  code_hash: sha256') <
        rendered.indexOf('  file_metrics: loc=4, tokens=9'),
    );
    assert.ok(
      rendered.indexOf('  file_metrics: loc=4, tokens=9') <
        rendered.indexOf('  import_files_list: 2 items'),
    );
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
        'Summary',
        '  file_metrics: 2 metric changes',
        '  import_files_list: +1 / -1',
        '',
        '[file_metrics]',
        '  loc: 5 -> 8 (delta +3)',
        '  tokens: 10 -> 15 (delta +5)',
        '',
        '[import_files_list]',
        '  Added: + package:flutter/material.dart',
        '  Removed: - ./local.dart',
        '',
      ].join('\n'),
    );
    assert.equal(first, second);
  });

  it('renders diff summaries for long added and map sections', () => {
    const style = createHumanFormatStyle(false);
    const output: DiffOutput = {
      from: { filename: 'from.dart', language: 'dart' },
      to: { filename: 'to.dart', language: 'dart' },
      rules: {
        function_map: Object.fromEntries(
          Array.from({ length: 12 }, (_, index) => [
            `func${String(index + 1).padStart(2, '0')}`,
            { status: 'unchanged' },
          ]),
        ),
        import_files_list: {
          added: Array.from(
            { length: 12 },
            (_, index) => `pkg/${String(index + 1).padStart(2, '0')}`,
          ),
          removed: [],
        },
      },
    };

    assert.equal(
      formatHumanDiff(output, style),
      [
        'From: from.dart',
        'To: to.dart',
        'Language: dart',
        '',
        'Summary',
        '  function_map: 12 unchanged',
        '  import_files_list: +12 / -0',
        '',
        '[function_map]',
        '  Count: 12 entries total',
        '  func01: unchanged',
        '  func02: unchanged',
        '  func03: unchanged',
        '  func04: unchanged',
        '  func05: unchanged',
        '  func06: unchanged',
        '  func07: unchanged',
        '  func08: unchanged',
        '  func09: unchanged',
        '  func10: unchanged',
        '  ... and 2 more',
        '',
        '[import_files_list]',
        '  Count: 12 added items total',
        '  Added: + pkg/01',
        '  Added: + pkg/02',
        '  Added: + pkg/03',
        '  Added: + pkg/04',
        '  Added: + pkg/05',
        '  Added: + pkg/06',
        '  Added: + pkg/07',
        '  Added: + pkg/08',
        '  Added: + pkg/09',
        '  Added: + pkg/10',
        '  ... and 2 more',
        '',
      ].join('\n'),
    );
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
        'Summary',
        '  code_hash: changed',
        '  file_metrics: 2 metric changes',
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
        '\u001B[36m\u001B[1mSummary\u001B[22m\u001B[39m',
        '  \u001B[1mmethod_map\u001B[22m: 1 modified',
        '',
        '\u001B[36m\u001B[1m[\u001B[1mmethod_map\u001B[22m]\u001B[22m\u001B[39m',
        '  paymentServiceCharge: \u001B[33mmodified\u001B[39m, loc=3 -> 5 (delta \u001B[32m+2\u001B[39m)',
        '',
      ].join('\n'),
    );
  });

  it('summarizes list diff counts deterministically', () => {
    assert.equal(
      summarizeDiffRule('import_files_list', {
        added: ['a', 'b'],
        removed: ['c'],
      }),
      'import_files_list: +2 / -1',
    );
  });

  it('summarizes metric diff changes deterministically', () => {
    assert.equal(
      summarizeDiffRule('file_metrics', {
        loc: { from: 1, to: 3, delta: 2 },
        loops: { from: 2, to: 2, delta: 0 },
        tokens: { from: 4, to: 7, delta: 3 },
      }),
      'file_metrics: 2 metric changes',
    );
    assert.equal(
      summarizeDiffRule('file_metrics', {
        loc: 2,
        loops: 0,
      }),
      'file_metrics: 1 metric changes',
    );
  });

  it('summarizes hash diffs as changed or unchanged', () => {
    assert.equal(
      summarizeDiffRule('code_hash', { changed: true }),
      'code_hash: changed',
    );
    assert.equal(
      summarizeDiffRule('code_hash', { changed: false }),
      'code_hash: unchanged',
    );
  });

  it('summarizes map diff statuses deterministically', () => {
    assert.equal(
      summarizeDiffRule('function_map', {
        a: { status: 'added' },
        b: { status: 'modified' },
        c: { status: 'modified' },
      }),
      'function_map: 1 added, 2 modified',
    );
  });

  it('falls back to a stable generic summary for unknown shapes', () => {
    assert.equal(
      summarizeDiffRule('interfaces_code_map', {
        PaymentProvider: 'type PaymentProvider interface{}',
      }),
      'interfaces_code_map: changed',
    );
  });

  it('renders diff summary before detailed sections in sorted rule order', () => {
    const style = createHumanFormatStyle(false);
    const output: DiffOutput = {
      from: { filename: 'from.ts', language: 'typescript' },
      to: { filename: 'to.ts', language: 'typescript' },
      rules: {
        import_files_list: { added: ['b'], removed: [] },
        code_hash: { changed: true },
        file_metrics: { loc: { from: 1, to: 2, delta: 1 } },
      },
    };

    assert.deepEqual(formatHumanDiffSummary(output, style), [
      'Summary',
      '  code_hash: changed',
      '  file_metrics: 1 metric changes',
      '  import_files_list: +1 / -0',
    ]);

    const rendered = formatHumanDiff(output, style);
    assert.ok(rendered.indexOf('Summary') < rendered.indexOf('[code_hash]'));
    assert.ok(
      rendered.indexOf('  code_hash: changed') <
        rendered.indexOf('  file_metrics: 1 metric changes'),
    );
    assert.ok(
      rendered.indexOf('  file_metrics: 1 metric changes') <
        rendered.indexOf('  import_files_list: +1 / -0'),
    );
  });
});
