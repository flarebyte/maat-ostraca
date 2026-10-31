import { z } from 'zod';
// These are the public fields queried by clients, independent of source syntax.
export const numericFields = {
  loc: z.number(),
  sloc: z.number(),
  cyclomaticComplexity: z.number(),
  cognitiveComplexity: z.number(),
  maxNestingDepth: z.number(),
  tokens: z.number(),
  loops: z.number(),
  conditions: z.number(),
};
const strings = z.array(z.string());
const symbol = {
  ...numericFields,
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  returnCount: z.number(),
  ioCallsCount: z.number(),
  ioReadCallsCount: z.number(),
  ioWriteCallsCount: z.number(),
  modifiers: strings,
  params: strings,
  returns: strings,
};
const map = <T extends z.ZodType>(schema: T) => z.record(z.string(), schema);
export const commonRuleContracts = {
  import_files_list: strings,
  package_imports_list: strings,
  env_names_list: strings,
  exception_messages_list: strings,
  error_messages_list: strings,
  testcase_titles_list: strings,
  file_metrics: z.strictObject(numericFields),
  code_hash: z.strictObject({
    algorithm: z.literal('sha256'),
    file: z.string().regex(/^[a-f0-9]{64}$/),
  }),
  function_map: map(z.strictObject(symbol)),
  method_map: map(
    z.strictObject({ ...symbol, name: z.string(), receiver: z.string() }),
  ),
  interface_map: map(
    z.strictObject({ modifiers: strings, extends: strings, methods: strings }),
  ),
  interfaces_code_map: map(z.string()),
  io_calls_count: z.strictObject({
    functions: map(z.number()),
    methods: map(z.number()),
  }),
  io_read_calls_count: z.strictObject({
    functions: map(z.number()),
    methods: map(z.number()),
  }),
  io_write_calls_count: z.strictObject({
    functions: map(z.number()),
    methods: map(z.number()),
  }),
};
