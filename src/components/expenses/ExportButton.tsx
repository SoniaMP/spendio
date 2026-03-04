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
  function handleExport() {
    const fileName = `gastos-${monthLabel.replace(/\s+/g, '-').toLowerCase()}.xlsx`;
    exportToExcel(expenses, fileName);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={expenses.length === 0}
    >
      <Download /> Exportar
    </Button>
  );
}
