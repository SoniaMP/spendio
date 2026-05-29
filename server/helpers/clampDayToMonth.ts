export function clampDayToMonth(
  year: number,
  month: number,
  day: number,
): string {
  const lastDay = new Date(year, month, 0).getDate();
  const safeDay = Math.min(Math.max(day, 1), lastDay);
  return `${year}-${String(month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
}
