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
  filename: 'internal/service/payment_service.go',
  language: 'go',
  rules: {
    'io.calls.count': 12,
    'io.read.calls.count': 5,
    'io.write.calls.count': 7,

    'import.files.list': ['context', 'fmt', 'net/http', 'os', 'time'],
    'import.functions.list': ['fmt.Sprintf', 'time.Now'],
    'import.types.list': ['http.Client', 'context.Context'],
    'package.imports.list': ['github.com/stripe/stripe-go/v79'],

    'exception.messages.list': ['panic: failed to parse payment payload'],
    'error.messages.list': [
      'missing api key',
      'payment provider timeout',
      'failed to decode response body',
    ],

    'function.signatures.map': {
      chargeCustomer: {
        params: ['ctx context.Context', 'req ChargeRequest'],
        returns: ['ChargeResponse', 'error'],
      },
    },
    'method.signatures.map': {
      paymentServiceCharge: {
        receiver: '*PaymentService',
        name: 'Charge',
        params: ['ctx context.Context', 'req ChargeRequest'],
        returns: ['ChargeResponse', 'error'],
      },
    },

    'function.metrics.map': {
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
    'method.metrics.map': {
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
    'class.metrics.map': {},
    'file.metrics': {
      loc: 212,
      sloc: 174,
      cyclomaticComplexity: 29,
      cognitiveComplexity: 41,
      maxNestingDepth: 5,
      tokens: 1230,
      loops: 4,
      conditions: 19,
    },

    'interfaces.list': ['PaymentProvider', 'AuditLogger'],
    'classes.list': [],
    'interfaces.code.map': {
      PaymentProvider:
        'type PaymentProvider interface { Charge(ctx context.Context, req ChargeRequest) (ChargeResponse, error) }',
    },

    'testcase.titles.list': [
      'Charge returns error when API key is missing',
      'Charge retries once on transient timeout',
    ],
    'env.names.list': ['STRIPE_API_KEY', 'PAYMENT_TIMEOUT_MS', 'LOG_LEVEL'],

    'code.hash': {
      algorithm: 'sha256',
      file: 'a7e5904f2d6dcf9ef95458c6f8db75749f579597f16bd8f7fd8d9f4db44de4aa',
    },
    'code.complexity': {
      cyclomatic: 29,
      rating: 'C',
    },
    'code.sloc': 174,
    'code.nesting.depth.max': 5,
    'code.cognitive.complexity': 41,
  },
};

export const exampleRulesListResult: CliRulesListResult = {
  language: 'go',
  rules: [
    {
      name: 'import.files.list',
      description: 'List all imported files',
    },
    {
      name: 'io.calls.count',
      description: 'Count all I/O calls',
    },
    {
      name: 'method.metrics.map',
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
