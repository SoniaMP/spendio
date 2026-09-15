import { format, parseISO } from 'date-fns';
import { getDateLocale } from '@/i18n/activeLocale';

// 'PP' is date-fns' localized medium date: it reorders the fields per locale
// ("4 mar 2026" in Spanish, "Mar 4, 2026" in English). An explicit pattern
// would only translate the month name and keep the Spanish field order.
export function formatDate(isoDate: string): string {
  return format(parseISO(isoDate), 'PP', { locale: getDateLocale() });
}
