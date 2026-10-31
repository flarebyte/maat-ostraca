export type Language =
  | 'go'
  | 'typescript'
  | 'dart'
  | 'python'
  | 'rust'
  | 'swift';

export const SUPPORTED_LANGUAGES: readonly Language[] = [
  'go',
  'typescript',
  'dart',
  'python',
  'rust',
  'swift',
] as const;
