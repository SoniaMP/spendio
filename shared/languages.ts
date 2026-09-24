/**
 * The languages the app supports, shared so the server, the client catalogs
 * and the email templates cannot drift apart. A test asserts that the client
 * catalogs in src/i18n/resources.ts cover exactly this list.
 */
export const Language = {
  Spanish: 'es',
  English: 'en',
} as const;

export type Language = (typeof Language)[keyof typeof Language];

export const SUPPORTED_LANGUAGES: readonly Language[] = Object.values(Language);

export const DEFAULT_LANGUAGE: Language = Language.Spanish;

export function resolveLanguage(value: string | null | undefined): Language {
  return SUPPORTED_LANGUAGES.includes(value as Language)
    ? (value as Language)
    : DEFAULT_LANGUAGE;
}
