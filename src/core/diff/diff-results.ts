import type { RuleName } from '../../rules/catalog.js';
import type { AnalyseOutput, DiffOutput } from '../contracts/outputs.js';
import { InternalError } from '../errors/index.js';
import { isObject } from './diff-results/common.js';
import { diffRule } from './diff-results/strategies.js';

interface DiffOptions {
  deltaOnly?: boolean;
}

export const diffResults = (
  fromOutput: AnalyseOutput,
  toOutput: AnalyseOutput,
  options: DiffOptions,
): DiffOutput => {
  const deltaOnly = Boolean(options.deltaOnly);

  if (!fromOutput.filename) {
    throw new InternalError(
      'diff_input_error: from output filename is required',
    );
  }

  if (fromOutput.language !== toOutput.language) {
    throw new InternalError(
      'diff_input_error: language mismatch between snapshots',
    );
  }

  const fromRules = isObject(fromOutput.rules) ? fromOutput.rules : {};
  const toRules = isObject(toOutput.rules) ? toOutput.rules : {};

  const ruleNames = [
    ...new Set<string>([...Object.keys(fromRules), ...Object.keys(toRules)]),
  ].sort((a, b) => a.localeCompare(b));
  const rules: Record<string, unknown> = {};

  for (const ruleName of ruleNames) {
    const diff = diffRule(
      ruleName as RuleName,
      fromRules[ruleName],
      toRules[ruleName],
      deltaOnly,
    );
    if (diff !== undefined) {
      rules[ruleName] = diff;
    }
  }

  return {
    from: {
      filename: fromOutput.filename,
      language: fromOutput.language,
    },
    to: {
      ...(toOutput.filename ? { filename: toOutput.filename } : {}),
      language: toOutput.language,
    },
    ...(deltaOnly ? { deltaOnly: true } : {}),
    rules,
  };
};
