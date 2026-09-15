import i18next from 'i18next';
import { es, enUS } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import resources from './resources';

type LanguageCode = keyof typeof resources;

const FALLBACK: LanguageCode = 'es';

/**
 * Formatting helpers are plain functions, so they cannot read the language
 * through useTranslation(). They resolve it here instead.
 *
 * Both maps are keyed by `LanguageCode`, so adding a language to `resources`
 * without giving it a locale here is a compile error. date-fns locales are
 * imported statically on purpose: a dynamic lookup would pull all ~100 of them
 * into the bundle.
 */
const DATE_LOCALES: Record<LanguageCode, Locale> = {
  es,
  en: enUS,
};

const INTL_LOCALES: Record<LanguageCode, string> = {
  es: 'es-ES',
  en: 'en-US',
};

function getActiveLanguage(): LanguageCode {
  const resolved = i18next.resolvedLanguage;
  return resolved && resolved in DATE_LOCALES
    ? (resolved as LanguageCode)
    : FALLBACK;
}

export function getDateLocale(): Locale {
  return DATE_LOCALES[getActiveLanguage()];
}

export function getIntlLocale(): string {
  return INTL_LOCALES[getActiveLanguage()];
}
