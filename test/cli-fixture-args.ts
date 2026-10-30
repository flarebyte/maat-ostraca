export const goHashDiffArgs = () => [
  'diff',
  '--from',
  'testdata/go/hash/v1.go',
  '--to',
  'testdata/go/hash/v2.go',
  '--rules',
  'code_hash',
  '--language',
  'go',
  '--json',
];
