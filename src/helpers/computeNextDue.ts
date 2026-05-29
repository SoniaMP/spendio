import { clampDayToMonth } from '@/helpers/clampDayToMonth';
import type {
  RecurringExpense,
  RecurringPeriod,
} from '@/types/recurringExpense';

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

export function nextDueDate(template: RecurringExpense): string {
  const nextIndex = template.last_generated_period_index + 1;
  return computeDueDateForPeriodIndex(
    template.period,
    template.start_date,
    nextIndex,
  );
}
