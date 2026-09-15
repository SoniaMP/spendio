import i18next from 'i18next';
import { ErrorCode } from '@shared/errorCodes';

const KNOWN_CODES = new Set<string>(Object.values(ErrorCode));

/**
 * The API answers with an error code, which the api layer rethrows as the
 * Error's message. Turns it into copy in the active language, falling back to
 * a generic message so an unmapped code never leaks a raw identifier into the
 * UI.
 */
export function getErrorMessage(error: unknown): string {
  const code = error instanceof Error ? error.message : String(error ?? '');

  return KNOWN_CODES.has(code)
    ? i18next.t(`errors.${code}` as 'errors.unknown')
    : i18next.t('errors.unknown');
}

export function isErrorCode(error: unknown, code: ErrorCode): boolean {
  return error instanceof Error && error.message === code;
}
