import i18next from 'i18next';
import { es, enUS } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { Language, resolveLanguage } from '@shared/languages';

/**
 * Formatting helpers are plain functions, so they cannot read the language
 * through useTranslation(). They resolve it here instead.
 *
 * Both maps are keyed by `Language`, so adding a language without giving it a
 * locale here is a compile error. date-fns locales are imported statically on
 * purpose: a dynamic lookup would pull all ~100 of them into the bundle.
 */
const DATE_LOCALES: Record<Language, Locale> = {
  [Language.Spanish]: es,
  [Language.English]: enUS,
};

const INTL_LOCALES: Record<Language, string> = {
  [Language.Spanish]: 'es-ES',
  [Language.English]: 'en-US',
};

function getActiveLanguage(): Language {
  return resolveLanguage(i18next.resolvedLanguage);
}

export function getDateLocale(): Locale {
  return DATE_LOCALES[getActiveLanguage()];
}

export function getIntlLocale(): string {
  return INTL_LOCALES[getActiveLanguage()];
}
