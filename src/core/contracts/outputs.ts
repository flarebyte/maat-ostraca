import type { RuleName } from '../../rules/catalog.js';
import type { Language } from './language.js';

export interface AnalyseOutput {
  filename?: string;
  language: Language;
  rules: Record<string, unknown>;
}

export interface RulesListOutput {
  language: Language;
  rules: Array<{ name: RuleName; description: string }>;
}

export interface DiffOutput {
  from: { filename: string; language: Language };
  to: { filename?: string; language: Language };
  deltaOnly?: true;
  rules: Record<string, unknown>;
}

export interface JsonErrorOutput {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
