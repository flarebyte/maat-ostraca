export type CliRuleValue =
  | number
  | string
  | string[]
  | Record<string, unknown>
  | Array<Record<string, unknown>>;

export type CliJsonResult = {
  filename: string;
  language: string;
  rules: Record<string, CliRuleValue>;
};

export type CliRulesListResult = {
  language: string;
  rules: Array<{
    name: string;
    description: string;
  }>;
};

export const exampleCliJsonResult: CliJsonResult = {
  filename: 'internal/service/payment_service.ts',
  language: 'typescript',
  rules: {
    io_calls_count: {
      functions: {
        chargeCustomer: 4,
      },
      methods: {
        paymentServiceCharge: 8,
      },
    },
    io_read_calls_count: {
      functions: {
        chargeCustomer: 2,
      },
      methods: {
        paymentServiceCharge: 3,
      },
    },
    io_write_calls_count: {
      functions: {
        chargeCustomer: 2,
      },
      methods: {
        paymentServiceCharge: 5,
      },
    },

    import_files_list: ['context', 'fmt', 'net/http', 'os', 'time'],
    import_functions_list: ['fmt.Sprintf', 'time.Now'],
    import_types_list: ['http.Client', 'context.Context'],
    package_imports_list: ['github.com/stripe/stripe-go/v79'],

    exception_messages_list: ['panic: failed to parse payment payload'],
    error_messages_list: [
      'missing api key',
      'payment provider timeout',
      'failed to decode response body',
    ],

    function_signatures_map: {
      chargeCustomer: {
        modifiers: ['async'],
        params: ['ctx: RequestContext', 'req: ChargeRequest'],
        returns: ['Promise<ChargeResponse>'],
      },
    },
    method_signatures_map: {
      paymentServiceCharge: {
        modifiers: ['override', 'private'],
        receiver: 'PaymentService',
        name: 'Charge',
        params: ['ctx: RequestContext', 'req: ChargeRequest'],
        returns: ['Promise<ChargeResponse>'],
      },
    },

    function_metrics_map: {
      chargeCustomer: {
        loc: 38,
        sloc: 31,
        cyclomaticComplexity: 7,
        cognitiveComplexity: 11,
        maxNestingDepth: 3,
        tokens: 214,
        sha256:
          'b64e0ef6509d3f2d001f56f40d6f2f16c5db74de969e5052cff10fbd2f6ff4e0',
        loops: 1,
        conditions: 6,
        returns: 4,
      },
    },
    method_metrics_map: {
      paymentServiceCharge: {
        receiver: '*PaymentService',
        name: 'Charge',
        loc: 54,
        sloc: 45,
        cyclomaticComplexity: 10,
        cognitiveComplexity: 15,
        maxNestingDepth: 4,
        tokens: 301,
        sha256:
          '8c1a5ef3e933b16b36f10a4885d2fd66dd275f79aa9f69f8fa593d7f644bdf68',
        loops: 1,
        conditions: 8,
        returns: 5,
      },
    },
    class_metrics_map: {},
    file_metrics: {
      loc: 212,
      sloc: 174,
      cyclomaticComplexity: 29,
      cognitiveComplexity: 41,
      maxNestingDepth: 5,
      tokens: 1230,
      loops: 4,
      conditions: 19,
    },

    interfaces_list: ['PaymentProvider', 'AuditLogger'],
    classes_list: [],
    interfaces_code_map: {
      PaymentProvider:
        'type PaymentProvider interface { Charge(ctx context.Context, req ChargeRequest) (ChargeResponse, error) }',
    },

    testcase_titles_list: [
      'Charge returns error when API key is missing',
      'Charge retries once on transient timeout',
    ],
    env_names_list: ['STRIPE_API_KEY', 'PAYMENT_TIMEOUT_MS', 'LOG_LEVEL'],

    code_hash: {
      algorithm: 'sha256',
      file: 'a7e5904f2d6dcf9ef95458c6f8db75749f579597f16bd8f7fd8d9f4db44de4aa',
    },
    code_complexity: {
      cyclomatic: 29,
      rating: 'C',
    },
    code_sloc: 174,
    code_nesting_depth_max: 5,
    code_cognitive_complexity: 41,
  },
};

export const exampleRulesListResult: CliRulesListResult = {
  language: 'go',
  rules: [
    {
      name: 'import_files_list',
      description: 'List all imported files',
    },
    {
      name: 'io_calls_count',
      description: 'Count all I/O calls',
    },
    {
      name: 'method_metrics_map',
      description: 'Map method metrics by method key',
    },
  ],
};

// Helpful when documenting the exact JSON output shape in markdown/docs.
export const exampleCliJsonResultText = JSON.stringify(
  exampleCliJsonResult,
  null,
  2,
);

export const exampleRulesListResultText = JSON.stringify(
  exampleRulesListResult,
  null,
  2,
);
