import { describe, it, expect, afterEach } from 'vitest';
import i18next from 'i18next';
import { ErrorCode } from '@shared/errorCodes';
import { getErrorMessage, isErrorCode } from '@/lib/errorMessage';
import resources from '@/i18n/resources';

describe('getErrorMessage', () => {
  afterEach(async () => {
    await i18next.changeLanguage('es');
  });

  it('translates a known code', () => {
    expect(getErrorMessage(new Error(ErrorCode.InvalidCredentials))).toBe(
      'Email o contraseña incorrectos',
    );
  });

  it('translates in the active language', async () => {
    await i18next.changeLanguage('en');

    expect(getErrorMessage(new Error(ErrorCode.InvalidCredentials))).toBe(
      'Wrong email or password',
    );
  });

  it('never leaks an unmapped code into the UI', () => {
    expect(getErrorMessage(new Error('WAT_IS_THIS'))).toBe(
      'Ha ocurrido un error inesperado',
    );
  });

  it('handles the dev fallbacks thrown by the api layer', () => {
    expect(getErrorMessage(new Error('Failed to fetch categories'))).toBe(
      'Ha ocurrido un error inesperado',
    );
  });

  it('handles values that are not errors', () => {
    expect(getErrorMessage(null)).toBe('Ha ocurrido un error inesperado');
    expect(getErrorMessage(undefined)).toBe('Ha ocurrido un error inesperado');
  });
});

describe('isErrorCode', () => {
  it('matches only the given code', () => {
    const error = new Error(ErrorCode.CategoryHasExpenses);

    expect(isErrorCode(error, ErrorCode.CategoryHasExpenses)).toBe(true);
    expect(isErrorCode(error, ErrorCode.CategoryNotFound)).toBe(false);
    expect(isErrorCode('not an error', ErrorCode.CategoryNotFound)).toBe(false);
  });
});

describe('error catalog', () => {
  // Without this, a new server code would silently render as
  // "something went wrong" in production.
  it.each(Object.keys(resources))(
    'the %s catalog covers every ErrorCode',
    (language) => {
      const errors = (
        resources[language as keyof typeof resources].translation as {
          errors: Record<string, string>;
        }
      ).errors;
      const missing = Object.values(ErrorCode).filter((code) => !errors[code]);

      expect(missing).toEqual([]);
    },
  );

  it('has no leftover entries for codes that no longer exist', () => {
    const errors = (
      resources.es.translation as { errors: Record<string, string> }
    ).errors;
    const codes = new Set<string>([...Object.values(ErrorCode), 'unknown']);
    const orphans = Object.keys(errors).filter((key) => !codes.has(key));

    expect(orphans).toEqual([]);
  });
});
