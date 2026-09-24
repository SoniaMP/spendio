import { describe, it, expect } from 'vitest';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '@shared/languages';
import resources from '@/i18n/resources';

/**
 * The server validates languages against SUPPORTED_LANGUAGES and picks email
 * templates from it, while the client renders whatever catalogs exist. If the
 * two drift, the server accepts a language the UI cannot render, or the
 * dropdown offers one the server rejects.
 */
describe('supported languages', () => {
  it('matches the client catalogs exactly', () => {
    expect([...SUPPORTED_LANGUAGES].sort()).toEqual(Object.keys(resources).sort());
  });

  it('has a catalog for the default language', () => {
    expect(Object.keys(resources)).toContain(DEFAULT_LANGUAGE);
  });
});
