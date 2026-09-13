import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

const SKELETON_ROWS = 5;

export default function ExpensesTableSkeleton() {
  const { t } = useTranslation();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('expenses.columns.date')}</TableHead>
          <TableHead>{t('expenses.columns.description')}</TableHead>
          <TableHead>{t('expenses.columns.category')}</TableHead>
          <TableHead className="text-right">{t('expenses.columns.amount')}</TableHead>
          <TableHead className="text-right">{t('common.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: SKELETON_ROWS }, (_, i) => (
          <TableRow key={i}>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="ml-auto h-4 w-16" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="ml-auto h-4 w-14" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
