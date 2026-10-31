import type { Language } from '../src/core/types.js';
export const languageContractMatrix: readonly {
  language: Language;
  from: string;
  to: string;
}[] = [
  {
    language: 'typescript',
    from: 'testdata/determinism/wide-v1.ts',
    to: 'testdata/determinism/wide-v2.ts',
  },
  {
    language: 'go',
    from: 'testdata/go/determinism/wide-v1.go',
    to: 'testdata/go/determinism/wide-v2.go',
  },
  {
    language: 'dart',
    from: 'testdata/dart/determinism/wide-v1.dart',
    to: 'testdata/dart/determinism/wide-v2.dart',
  },
  {
    language: 'python',
    from: 'testdata/python/regression/v1.py',
    to: 'testdata/python/regression/v2.py',
  },
  {
    language: 'rust',
    from: 'testdata/rust/regression/v1.rs',
    to: 'testdata/rust/regression/v2.rs',
  },
];
