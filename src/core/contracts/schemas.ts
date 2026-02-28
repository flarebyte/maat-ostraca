import { z } from 'zod';
import { RULE_NAMES } from '../../rules/catalog.js';

export const LanguageSchema = z.enum(['go', 'typescript', 'dart']);
export const RuleNameSchema = z.enum(RULE_NAMES);

export const AnalyseOutputSchema = z
  .object({
    filename: z.string().optional(),
    language: LanguageSchema,
    rules: z.record(z.string(), z.unknown()),
  })
  .strict();

export const RulesListOutputSchema = z
  .object({
    language: LanguageSchema,
    rules: z.array(
      z
        .object({
          name: RuleNameSchema,
          description: z.string(),
        })
        .strict(),
    ),
  })
  .strict();

export const DiffOutputSchema = z
  .object({
    from: z
      .object({
        filename: z.string(),
        language: LanguageSchema,
      })
      .strict(),
    to: z
      .object({
        filename: z.string().optional(),
        language: LanguageSchema,
      })
      .strict(),
    deltaOnly: z.literal(true).optional(),
    rules: z.record(z.string(), z.unknown()),
  })
  .strict();

export const JsonErrorOutputSchema = z
  .object({
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.record(z.string(), z.unknown()).optional(),
      })
      .strict(),
  })
  .strict();
