import type {
  AnalyseOutput,
  DiffOutput,
  RulesListOutput,
} from '../contracts/outputs.js';
import type { OutputKind } from '../contracts/validate.js';
import { canonicalStringify } from './canonical-json.js';
import { formatHumanAnalyse } from './human/analyse.js';
import { formatHumanDiff } from './human/diff.js';
import { formatHumanRules } from './human/rules.js';

export const formatOutput = (
  kind: OutputKind,
  result: AnalyseOutput | DiffOutput | RulesListOutput,
  json: boolean,
): string => {
  if (json) {
    return `${canonicalStringify(result)}\n`;
  }

  switch (kind) {
    case 'analyse':
      return formatHumanAnalyse(result as AnalyseOutput);
    case 'diff':
      return formatHumanDiff(result as DiffOutput);
    case 'rules':
      return formatHumanRules(result as RulesListOutput);
    default:
      throw new Error(`unsupported output kind: ${String(kind)}`);
  }
};
