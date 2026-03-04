import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function getMonthLabel(year: number, month: number): string {
  const date = new Date(year, month - 1);
  return format(date, 'MMMM yyyy', { locale: es });
}

export function getCurrentMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}
