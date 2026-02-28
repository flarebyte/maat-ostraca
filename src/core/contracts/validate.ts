import { InternalError } from '../errors/index.js';
import {
  AnalyseOutputSchema,
  DiffOutputSchema,
  JsonErrorOutputSchema,
  RulesListOutputSchema,
} from './schemas.js';

export type OutputKind = 'analyse' | 'diff' | 'rules' | 'error';

const schemaByKind = {
  analyse: AnalyseOutputSchema,
  diff: DiffOutputSchema,
  rules: RulesListOutputSchema,
  error: JsonErrorOutputSchema,
};

export const validateOutputOrThrow = (
  kind: OutputKind,
  value: unknown,
): void => {
  const schema = schemaByKind[kind];
  const parsed = schema.safeParse(value);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      code: issue.code,
    }));

    throw new InternalError(`output_validation_failed: ${kind}`, {
      details: {
        kind,
        issues,
      },
    });
  }
};
