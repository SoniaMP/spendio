import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
} from 'date-fns';
import { es } from 'date-fns/locale';

export enum DatePreset {
  ThisMonth = 'this-month',
  Last3Months = 'last-3-months',
  ThisYear = 'this-year',
  Custom = 'custom',
}

export interface DateRange {
  from: string;
  to: string;
}

export function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function getMonthLabel(year: number, month: number): string {
  const date = new Date(year, month - 1);
  return format(date, 'MMMM yyyy', { locale: es });
}

export function getPreviousMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
}

export function getCurrentMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

const ISO_DATE = 'yyyy-MM-dd';

export function getDateRangeForPreset(preset: DatePreset, today: Date = new Date()): DateRange {
  switch (preset) {
    case DatePreset.Last3Months:
      return {
        from: format(startOfMonth(subMonths(today, 2)), ISO_DATE),
        to: format(endOfMonth(today), ISO_DATE),
      };
    case DatePreset.ThisYear:
      return {
        from: format(startOfYear(today), ISO_DATE),
        to: format(endOfYear(today), ISO_DATE),
      };
    case DatePreset.ThisMonth:
    default:
      return {
        from: format(startOfMonth(today), ISO_DATE),
        to: format(endOfMonth(today), ISO_DATE),
      };
  }
}

export function formatDateRangeLabel(from: string, to: string): string {
  const fromLabel = format(parseISO(from), 'd MMM yyyy', { locale: es });
  const toLabel = format(parseISO(to), 'd MMM yyyy', { locale: es });
  return `${fromLabel} – ${toLabel}`;
}
