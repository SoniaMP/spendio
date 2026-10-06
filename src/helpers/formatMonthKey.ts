import { getMonthLabel } from '@/helpers/dateHelpers';

/** Turns a `'YYYY-MM'` month key into the localized label, e.g. "octubre 2026". */
export function formatMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return getMonthLabel(year, month);
}
