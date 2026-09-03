import es from './locales/es.json';
import en from './locales/en.json';

/**
 * Single source of truth for the available languages: the selector and the
 * i18next config both derive the list from these keys, so adding a language
 * only means adding its catalog here.
 */
const resources = {
  es: { translation: es },
  en: { translation: en },
};

export default resources;
