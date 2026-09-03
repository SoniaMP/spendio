import 'i18next';
import type es from '@/i18n/locales/es.json';

/**
 * Makes t() key-checked at compile time against the Spanish catalog, which is
 * the reference: a typo or a key missing from es.json is a build error.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof es };
  }
}
