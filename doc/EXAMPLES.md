# Examples (Generated)

## Analyze Command Output

```json
{
  "filename": "internal/service/payment_service.ts",
  "language": "typescript",
  "rules": {
    "function_map": {
      "chargeCustomer": {
        "modifiers": [
          "async"
        ],
        "params": [
          "ctx: RequestContext",
          "req: ChargeRequest"
        ],
        "returns": [
          "Promise<ChargeResponse>"
        ],
        "loc": 38,
        "sloc": 31,
        "cyclomaticComplexity": 7,
        "cognitiveComplexity": 11,
        "maxNestingDepth": 3,
        "tokens": 214,
        "sha256": "b64e0ef6509d3f2d001f56f40d6f2f16c5db74de969e5052cff10fbd2f6ff4e0",
        "loops": 1,
        "conditions": 6,
        "returnCount": 4,
        "ioCallsCount": 4,
        "ioReadCallsCount": 2,
        "ioWriteCallsCount": 2
      }
    },
    "method_map": {
      "paymentServiceCharge": {
        "modifiers": [
          "override",
          "private"
        ],
        "receiver": "PaymentService",
        "name": "Charge",
        "params": [
          "ctx: RequestContext",
          "req: ChargeRequest"
        ],
        "returns": [
          "Promise<ChargeResponse>"
        ],
        "loc": 54,
        "sloc": 45,
        "cyclomaticComplexity": 10,
        "cognitiveComplexity": 15,
        "maxNestingDepth": 4,
        "tokens": 301,
        "sha256": "8c1a5ef3e933b16b36f10a4885d2fd66dd275f79aa9f69f8fa593d7f644bdf68",
        "loops": 1,
        "conditions": 8,
        "returnCount": 5,
        "ioCallsCount": 8,
        "ioReadCallsCount": 3,
        "ioWriteCallsCount": 5
      }
    },
    "import_files_list": [
      "context",
      "fmt",
      "net/http",
      "os",
      "time"
    ],
    "import_functions_list": [
      "fmt.Sprintf",
      "time.Now"
    ],
    "import_types_list": [
      "http.Client",
      "context.Context"
    ],
    "package_imports_list": [
      "github.com/stripe/stripe-go/v79"
    ],
    "exception_messages_list": [
      "panic: failed to parse payment payload"
    ],
    "error_messages_list": [
      "missing api key",
      "payment provider timeout",
      "failed to decode response body"
    ],
    "class_map": {
      "PaymentService": {
        "modifiers": [
          "abstract",
          "export"
        ],
        "extends": "BaseService",
        "implements": [
          "PaymentProvider"
        ],
        "methodCount": 6,
        "loc": 119,
        "sloc": 96,
        "cyclomaticComplexity": 12,
        "cognitiveComplexity": 18,
        "maxNestingDepth": 3,
        "tokens": 672,
        "sha256": "27a5fc67ab26922f6c25d2b5fdc2944768c625f9168fd66ac8fbe0efb94a4306"
      }
    },
    "file_metrics": {
      "loc": 212,
      "sloc": 174,
      "cyclomaticComplexity": 29,
      "cognitiveComplexity": 41,
      "maxNestingDepth": 5,
      "tokens": 1230,
      "loops": 4,
      "conditions": 19
    },
    "interface_map": {
      "AuditLogger": {
        "modifiers": [
          "export"
        ],
        "extends": [],
        "methods": [
          "log(event: AuditEvent): void"
        ]
      },
      "PaymentProvider": {
        "modifiers": [
          "export"
        ],
        "extends": [],
        "methods": [
          "Charge(ctx: RequestContext, req: ChargeRequest): Promise<ChargeResponse>"
        ]
      }
    },
    "interfaces_code_map": {
      "PaymentProvider": "type PaymentProvider interface { Charge(ctx context.Context, req ChargeRequest) (ChargeResponse, error) }"
    },
    "testcase_titles_list": [
      "Charge returns error when API key is missing",
      "Charge retries once on transient timeout"
    ],
    "env_names_list": [
      "STRIPE_API_KEY",
      "PAYMENT_TIMEOUT_MS",
      "LOG_LEVEL"
    ],
    "code_hash": {
      "algorithm": "sha256",
      "file": "a7e5904f2d6dcf9ef95458c6f8db75749f579597f16bd8f7fd8d9f4db44de4aa"
    }
  }
}
```

## Rules List Command Output

```json
{
  "language": "go",
  "rules": [
    {
      "name": "import_files_list",
      "description": "List all imported files"
    },
    {
      "name": "function_map",
      "description": "Function-level map keyed by function name"
    },
    {
      "name": "method_map",
      "description": "Method-level map keyed by method key"
    },
    {
      "name": "class_map",
      "description": "Class-level map keyed by class name"
    },
    {
      "name": "interface_map",
      "description": "Interface-level map keyed by interface name"
    }
  ]
}
```
