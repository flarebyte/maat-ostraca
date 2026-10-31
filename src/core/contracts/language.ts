export type Language = 'go' | 'typescript' | 'dart' | 'python' | 'rust';

export const SUPPORTED_LANGUAGES: readonly Language[] = [
  'go',
  'typescript',
  'dart',
  'python',
  'rust',
] as const;
