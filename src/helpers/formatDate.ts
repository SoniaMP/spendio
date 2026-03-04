import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(isoDate: string): string {
  return format(parseISO(isoDate), 'd MMM yyyy', { locale: es });
}
