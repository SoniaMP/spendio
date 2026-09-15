import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ExpenseWithCategory } from '@/types/expense';
import { exportToExcel } from '@/helpers/exportToExcel';

interface ExportButtonProps {
  expenses: ExpenseWithCategory[];
  monthLabel: string;
}

export default function ExportButton({
  expenses,
  monthLabel,
}: ExportButtonProps) {
  const { t } = useTranslation();

  function handleExport() {
    const month = monthLabel.replace(/\s+/g, '-').toLowerCase();
    exportToExcel(expenses, t('expenses.exportFileName', { month }));
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={expenses.length === 0}
    >
      <Download /> <span className="hidden sm:inline">{t('expenses.export')}</span>
    </Button>
  );
}
