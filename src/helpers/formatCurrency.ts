import { getIntlLocale } from '@/i18n/activeLocale';

// The currency stays EUR in every language; only the formatting changes.
const CURRENCY = 'EUR';

const formatters = new Map<string, Intl.NumberFormat>();

/**
 * Cached per locale rather than created once at module level, so switching
 * language actually changes the output.
 */
function getFormatter(locale: string): Intl.NumberFormat {
  const cached = formatters.get(locale);
  if (cached) return cached;

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: CURRENCY,
  });
  formatters.set(locale, formatter);
  return formatter;
}

export function formatCurrency(amount: number): string {
  return getFormatter(getIntlLocale()).format(amount);
}
