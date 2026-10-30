export type Language = 'go' | 'typescript' | 'dart' | 'python';

export const SUPPORTED_LANGUAGES: readonly Language[] = [
  'go',
  'typescript',
  'dart',
  'python',
] as const;
