export type Language = 'go' | 'typescript' | 'dart';

export const SUPPORTED_LANGUAGES: readonly Language[] = [
  'go',
  'typescript',
  'dart',
] as const;
