import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from '@/components/ui/table';
import SortableTableHead from '@/components/ui/SortableTableHead';
import type { Category } from '@/types/category';
import CategoryRow from '@/components/categories/CategoryRow';
import { useSort } from '@/hooks/useSort';

type CategorySortKey = 'name' | 'color';

interface CategoriesTableProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

const SORT_ACCESSORS: Record<CategorySortKey, (c: Category) => string> = {
  name: (c) => c.name.toLowerCase(),
  color: (c) => c.color.toLowerCase(),
};

export default function CategoriesTable({
  categories,
  onEdit,
  onDelete,
}: CategoriesTableProps) {
  const { t } = useTranslation();
  const accessors = useMemo(() => SORT_ACCESSORS, []);
  const { sortedItems, sortColumn, sortDirection, toggleSort } = useSort(categories, accessors);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableTableHead
            isActive={sortColumn === 'name'}
            direction={sortDirection}
            onToggle={() => toggleSort('name')}
          >
            {t('categories.columns.name')}
          </SortableTableHead>
          <SortableTableHead
            isActive={sortColumn === 'color'}
            direction={sortDirection}
            onToggle={() => toggleSort('color')}
          >
            {t('categories.columns.color')}
          </SortableTableHead>
          <TableHead className="text-right">{t('common.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedItems.map((category) => (
          <CategoryRow
            key={category.id}
            category={category}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </Table>
  );
}
