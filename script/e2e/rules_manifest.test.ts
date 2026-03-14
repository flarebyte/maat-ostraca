import { expect, test } from 'bun:test';
import {
  asUtf8,
  equalBytes,
  expectRepeatedRulesGolden,
  expectSuccess,
  parseRulesListOutput,
  runTwice,
} from './helpers.js';

test('maat rules json manifest for typescript matches golden and is deterministic', () => {
  expectRepeatedRulesGolden(
    ['rules', '--language', 'typescript', '--json'],
    'testdata/rules/typescript.golden.json',
  );
});

test('maat rules json manifest for go matches golden and is deterministic', () => {
  expectRepeatedRulesGolden(
    ['rules', '--language', 'go', '--json'],
    'testdata/rules/go.golden.json',
  );
});

test('maat rules json manifest for dart matches golden and is deterministic', () => {
  expectRepeatedRulesGolden(
    ['rules', '--language', 'dart', '--json'],
    'testdata/rules/dart.golden.json',
  );
});

test('maat rules json manifests keep names sorted and descriptions stable', () => {
  for (const language of ['typescript', 'go', 'dart'] as const) {
    const { first, second } = runTwice([
      'rules',
      '--language',
      language,
      '--json',
    ]);
    const firstStdout = expectSuccess(first);
    const secondStdout = expectSuccess(second);
    const output = parseRulesListOutput(firstStdout);

    expect(equalBytes(firstStdout, secondStdout)).toBeTrue();

    const names = output.rules.map((rule) => rule.name);
    const sorted = [...names].sort((left, right) => left.localeCompare(right));
    expect(names).toEqual(sorted);
    expect(
      output.rules.every(
        (rule) =>
          typeof rule.description === 'string' && rule.description.length > 0,
      ),
    ).toBeTrue();

    if (language === 'typescript') {
      expect(
        output.rules.find((rule) => rule.name === 'code_hash')?.description,
      ).toBe('Compute deterministic code-level content hash.');
    }
    if (language === 'go') {
      expect(
        output.rules.find((rule) => rule.name === 'function_map')?.description,
      ).toBe('Map function declarations and signatures.');
    }
    if (language === 'dart') {
      expect(
        output.rules.find((rule) => rule.name === 'class_map')?.description,
      ).toBe('Map class declarations and members.');
    }
  }
});

test('maat rules human output remains deterministic for typescript', () => {
  const { first, second } = runTwice(['rules', '--language', 'typescript']);
  const firstStdout = expectSuccess(first);
  const secondStdout = expectSuccess(second);
  const output = asUtf8(firstStdout);

  expect(equalBytes(firstStdout, secondStdout)).toBeTrue();
  expect(output).toContain('Language: typescript');
});

test('maat rules --match json manifest for typescript matches golden and is deterministic', () => {
  expectRepeatedRulesGolden(
    [
      'rules',
      '--language',
      'typescript',
      '--match',
      'function_map,code_hash',
      '--json',
    ],
    'testdata/rules/typescript.filtered.golden.json',
  );
});

test('maat rules --match json manifest for go matches golden and is deterministic', () => {
  expectRepeatedRulesGolden(
    [
      'rules',
      '--language',
      'go',
      '--match',
      'interface_map,code_hash',
      '--json',
    ],
    'testdata/rules/go.filtered.golden.json',
  );
});

test('maat rules --match json manifest for dart matches golden and is deterministic', () => {
  expectRepeatedRulesGolden(
    [
      'rules',
      '--language',
      'dart',
      '--match',
      'class_map,testcase_titles_list',
      '--json',
    ],
    'testdata/rules/dart.filtered.golden.json',
  );
});

test('maat rules json manifest without --match remains unchanged from the approved golden', () => {
  expectRepeatedRulesGolden(
    ['rules', '--language', 'typescript', '--json'],
    'testdata/rules/typescript.golden.json',
  );
});
