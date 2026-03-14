import { test } from 'bun:test';
import {
  expectRepeatedAnalyseGolden,
  expectRepeatedDiffGolden,
} from './helpers.js';

test('typescript analyse output remains byte-identical to the approved golden', () => {
  const args = [
    'analyse',
    '--in',
    'testdata/symbols/analyse.ts',
    '--rules',
    'function_map,method_map,class_map,interface_map,interfaces_code_map',
    '--language',
    'typescript',
    '--json',
  ];

  expectRepeatedAnalyseGolden(args, 'testdata/symbols/analyse.golden.json');
});

test('typescript diff output remains byte-identical to the approved golden', () => {
  const args = [
    'diff',
    '--from',
    'testdata/metrics/v1.ts',
    '--to',
    'testdata/metrics/v2.ts',
    '--rules',
    'file_metrics',
    '--language',
    'typescript',
    '--json',
  ];

  expectRepeatedDiffGolden(
    args,
    'testdata/metrics/diff-file-metrics.golden.json',
  );
});

test('go analyse output remains byte-identical to the approved golden', () => {
  const args = [
    'analyse',
    '--in',
    'testdata/go/messages/analyse.go',
    '--rules',
    'exception_messages_list,error_messages_list',
    '--language',
    'go',
    '--json',
  ];

  expectRepeatedAnalyseGolden(args, 'testdata/go/messages/analyse.golden.json');
});

test('go diff output remains byte-identical to the approved golden', () => {
  const args = [
    'diff',
    '--from',
    'testdata/go/hash/v1.go',
    '--to',
    'testdata/go/hash/v2.go',
    '--rules',
    'code_hash',
    '--language',
    'go',
    '--json',
  ];

  expectRepeatedDiffGolden(args, 'testdata/go/hash/diff.golden.json');
});
