import { clampDayToMonth } from './clampDayToMonth.ts';
import { computeDueDateForPeriodIndex } from './computeDueDate.ts';
import type { RecurringPeriod } from '../types.ts';

export const HORIZON_MONTHS = 12;
export const HORIZON_YEARS = 5;
const MAX_PERIODS = 10_000;

export function addMonthsIso(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const total = m - 1 + months;
  const newYear = y + Math.floor(total / 12);
  const newMonth = ((total % 12) + 12) % 12 + 1;
  return clampDayToMonth(newYear, newMonth, d);
}

export function addYearsIso(iso: string, years: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return clampDayToMonth(y + years, m, d);
}

export function addDaysIso(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function horizonTargetDate(period: RecurringPeriod, today: string): string {
  return period === 'monthly'
    ? addMonthsIso(today, HORIZON_MONTHS)
    : addYearsIso(today, HORIZON_YEARS);
}

export function lastPeriodIndexUpTo(
  period: RecurringPeriod,
  startDate: string,
  targetDate: string,
): number {
  if (targetDate < startDate) return -1;
  let last = -1;
  for (let i = 0; i < MAX_PERIODS; i++) {
    const due = computeDueDateForPeriodIndex(period, startDate, i);
    if (due > targetDate) break;
    last = i;
  }
  return last;
}

export function firstPeriodIndexOnOrAfter(
  period: RecurringPeriod,
  startDate: string,
  targetDate: string,
): number {
  for (let i = 0; i < MAX_PERIODS; i++) {
    const due = computeDueDateForPeriodIndex(period, startDate, i);
    if (due >= targetDate) return i;
  }
  return -1;
}
