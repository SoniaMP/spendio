import { getMonthKey, getMonthLabel, getPreviousMonth } from '@/helpers/dateHelpers';

export interface MonthOption {
  key: string;
  label: string;
}

export function getComparisonMonths(
  currentYear: number,
  currentMonth: number,
  count = 12,
): MonthOption[] {
  const months: MonthOption[] = [];
  let { year, month } = getPreviousMonth(currentYear, currentMonth);

  for (let i = 0; i < count; i++) {
    months.push({
      key: getMonthKey(year, month),
      label: getMonthLabel(year, month),
    });
    const prev = getPreviousMonth(year, month);
    year = prev.year;
    month = prev.month;
  }

  return months;
}
