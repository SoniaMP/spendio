import { clampDayToMonth } from './clampDayToMonth.ts';
import type { RecurringPeriod } from '../types.ts';

export function computeDueDateForPeriodIndex(
  period: RecurringPeriod,
  startDate: string,
  periodIndex: number,
): string {
  const [year, month, day] = startDate.split('-').map(Number);
  if (period === 'monthly') {
    const totalMonths = month - 1 + periodIndex;
    const targetYear = year + Math.floor(totalMonths / 12);
    const targetMonth = (totalMonths % 12) + 1;
    return clampDayToMonth(targetYear, targetMonth, day);
  }
  return clampDayToMonth(year + periodIndex, month, day);
}
