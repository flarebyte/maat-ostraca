export const SUPPORTED_LANGUAGES = ['go', 'typescript', 'dart'] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];
