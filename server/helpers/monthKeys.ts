/**
 * Month keys are `'YYYY-MM'`. The format is deliberately uniform so that the
 * validity intervals of `income_lines` can be compared as plain strings, which
 * is also what the `(user_id, start_month)` index relies on. The schema enforces
 * the shape with a GLOB check; these helpers enforce it at the API boundary.
 */
const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isValidMonthKey(value: string): boolean {
  return MONTH_KEY_PATTERN.test(value);
}

function addMonths(monthKey: string, months: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const zeroBased = month - 1 + months;
  const targetYear = year + Math.floor(zeroBased / 12);
  const targetMonth = (((zeroBased % 12) + 12) % 12) + 1;
  return `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
}

export function previousMonthKey(monthKey: string): string {
  return addMonths(monthKey, -1);
}

export function nextMonthKey(monthKey: string): string {
  return addMonths(monthKey, 1);
}
