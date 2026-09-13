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

const SKELETON_ROWS = 4;

export default function CategoriesTableSkeleton() {
  const { t } = useTranslation();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('categories.columns.name')}</TableHead>
          <TableHead>{t('categories.columns.color')}</TableHead>
          <TableHead className="text-right">{t('common.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: SKELETON_ROWS }, (_, i) => (
          <TableRow key={i}>
            <TableCell>
              <Skeleton className="h-4 w-28" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-16" />
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
