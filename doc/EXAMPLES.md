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

## Diff Command Output

```json
{
  "from": {
    "filename": "internal/service/payment_service.ts",
    "language": "typescript"
  },
  "to": {
    "filename": "internal/service/payment_service_v2.ts",
    "language": "typescript"
  },
  "rules": {
    "function_map": {
      "chargeCustomer": {
        "status": "modified",
        "loc": {
          "from": 38,
          "to": 44,
          "delta": 6
        },
        "sloc": {
          "from": 31,
          "to": 36,
          "delta": 5
        },
        "cyclomaticComplexity": {
          "from": 7,
          "to": 9,
          "delta": 2
        },
        "cognitiveComplexity": {
          "from": 11,
          "to": 14,
          "delta": 3
        },
        "maxNestingDepth": {
          "from": 3,
          "to": 4,
          "delta": 1
        },
        "ioCallsCount": {
          "from": 4,
          "to": 6,
          "delta": 2
        },
        "ioReadCallsCount": {
          "from": 2,
          "to": 3,
          "delta": 1
        },
        "ioWriteCallsCount": {
          "from": 2,
          "to": 3,
          "delta": 1
        }
      },
      "refundCustomer": {
        "status": "added"
      }
    },
    "method_map": {
      "paymentServiceCharge": {
        "status": "modified",
        "loc": {
          "from": 54,
          "to": 61,
          "delta": 7
        },
        "sloc": {
          "from": 45,
          "to": 50,
          "delta": 5
        },
        "cyclomaticComplexity": {
          "from": 10,
          "to": 12,
          "delta": 2
        },
        "cognitiveComplexity": {
          "from": 15,
          "to": 18,
          "delta": 3
        }
      }
    },
    "class_map": {
      "PaymentService": {
        "status": "modified",
        "methodCount": {
          "from": 6,
          "to": 7,
          "delta": 1
        },
        "loc": {
          "from": 119,
          "to": 141,
          "delta": 22
        },
        "sloc": {
          "from": 96,
          "to": 113,
          "delta": 17
        }
      }
    },
    "interface_map": {
      "PaymentProvider": {
        "status": "modified",
        "methods": {
          "added": [
            "Refund(ctx: RequestContext, req: RefundRequest): Promise<RefundResponse>"
          ],
          "removed": []
        }
      }
    },
    "file_metrics": {
      "loc": {
        "from": 212,
        "to": 249,
        "delta": 37
      },
      "sloc": {
        "from": 174,
        "to": 204,
        "delta": 30
      },
      "cyclomaticComplexity": {
        "from": 29,
        "to": 36,
        "delta": 7
      },
      "cognitiveComplexity": {
        "from": 41,
        "to": 50,
        "delta": 9
      },
      "maxNestingDepth": {
        "from": 5,
        "to": 6,
        "delta": 1
      },
      "tokens": {
        "from": 1230,
        "to": 1468,
        "delta": 238
      },
      "loops": {
        "from": 4,
        "to": 5,
        "delta": 1
      },
      "conditions": {
        "from": 19,
        "to": 24,
        "delta": 5
      }
    },
    "import_files_list": {
      "added": [
        "crypto"
      ],
      "removed": []
    },
    "error_messages_list": {
      "added": [
        "payment provider rejected refund"
      ],
      "removed": []
    },
    "code_hash": {
      "from": "a7e5904f2d6dcf9ef95458c6f8db75749f579597f16bd8f7fd8d9f4db44de4aa",
      "to": "53a4d8784f7f0956f1e4d8e47085817ae8e4992d08117417ea735be070d2bd3f",
      "changed": true
    }
  }
}
```

## Diff Command Output (`--delta-only`)

```json
{
  "from": {
    "filename": "internal/service/payment_service.ts",
    "language": "typescript"
  },
  "to": {
    "filename": "internal/service/payment_service_v2.ts",
    "language": "typescript"
  },
  "deltaOnly": true,
  "rules": {
    "function_map": {
      "chargeCustomer": {
        "status": "modified",
        "loc": 6,
        "sloc": 5,
        "cyclomaticComplexity": 2,
        "cognitiveComplexity": 3,
        "maxNestingDepth": 1,
        "ioCallsCount": 2,
        "ioReadCallsCount": 1,
        "ioWriteCallsCount": 1
      },
      "refundCustomer": {
        "status": "added"
      }
    },
    "method_map": {
      "paymentServiceCharge": {
        "status": "modified",
        "loc": 7,
        "sloc": 5,
        "cyclomaticComplexity": 2,
        "cognitiveComplexity": 3
      }
    },
    "class_map": {
      "PaymentService": {
        "status": "modified",
        "methodCount": 1,
        "loc": 22,
        "sloc": 17
      }
    },
    "interface_map": {
      "PaymentProvider": {
        "status": "modified",
        "methods": {
          "added": [
            "Refund(ctx: RequestContext, req: RefundRequest): Promise<RefundResponse>"
          ],
          "removed": []
        }
      }
    },
    "file_metrics": {
      "loc": 37,
      "sloc": 30,
      "cyclomaticComplexity": 7,
      "cognitiveComplexity": 9,
      "maxNestingDepth": 1,
      "tokens": 238,
      "loops": 1,
      "conditions": 5
    },
    "import_files_list": {
      "added": [
        "crypto"
      ],
      "removed": []
    },
    "error_messages_list": {
      "added": [
        "payment provider rejected refund"
      ],
      "removed": []
    },
    "code_hash": {
      "changed": true
    }
  }
}
```
