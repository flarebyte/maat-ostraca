import type {
  AnalyseOutput,
  DiffOutput,
  RulesListOutput,
} from '../contracts/outputs.js';
import type { OutputKind } from '../contracts/validate.js';
import { canonicalStringify } from './canonical-json.js';
import { formatHumanAnalyse } from './human/analyse.js';
import {
  createHumanFormatStyle,
  type HumanFormatStyle,
  supportsHumanColor,
} from './human/color.js';
import { formatHumanDiff } from './human/diff.js';
import { formatHumanRules } from './human/rules.js';

type ProcessEnvShape = Record<string, string | undefined>;

export interface FormatOutputOptions {
  colorEnabled?: boolean;
  env?: ProcessEnvShape | undefined;
  isTTY?: boolean;
}

export const formatOutput = (
  kind: OutputKind,
  result: AnalyseOutput | DiffOutput | RulesListOutput,
  json: boolean,
  options: FormatOutputOptions = {},
): string => {
  if (json) {
    return `${canonicalStringify(result)}\n`;
  }

  const style: HumanFormatStyle = createHumanFormatStyle(
    options.colorEnabled ??
      supportsHumanColor({
        isTTY: options.isTTY ?? false,
        env: options.env,
      }),
  );

  switch (kind) {
    case 'analyse':
      return formatHumanAnalyse(result as AnalyseOutput, style);
    case 'diff':
      return formatHumanDiff(result as DiffOutput, style);
    case 'rules':
      return formatHumanRules(result as RulesListOutput, style);
    default:
      throw new Error(`unsupported output kind: ${String(kind)}`);
  }
};
