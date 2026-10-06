import { useState } from 'react';
import MonthlyIncomeChip from '@/components/income/MonthlyIncomeChip';
import IncomeLinesDialog from '@/components/income/IncomeLinesDialog';
import IncomeLineFormDialog from '@/components/income/IncomeLineFormDialog';
import IncomeLineEditDialog from '@/components/income/IncomeLineEditDialog';
import type { IncomeLine } from '@/types/income';

interface Props {
  /** Month currently shown by the expenses view, `'YYYY-MM'`. */
  monthKey: string;
}

/**
 * Wires the income chip to its two dialogs. It exists so the `+` can open the
 * new-line form straight away — without it, either the form would be rendered
 * twice or adding a line would mean going through the panel first.
 */
export default function MonthlyIncomeSection({ monthKey }: Props) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<IncomeLine | null>(null);

  return (
    <>
      <MonthlyIncomeChip
        monthKey={monthKey}
        onAddLine={() => setIsFormOpen(true)}
        onManageLines={() => setIsPanelOpen(true)}
      />

      <IncomeLinesDialog
        monthKey={monthKey}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onAddLine={() => setIsFormOpen(true)}
        onEditLine={setEditingLine}
      />

      <IncomeLineFormDialog
        monthKey={monthKey}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />

      <IncomeLineEditDialog
        line={editingLine}
        monthKey={monthKey}
        isOpen={editingLine !== null}
        onClose={() => setEditingLine(null)}
      />
    </>
  );
}
