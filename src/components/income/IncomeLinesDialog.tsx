import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDownToLine, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useMonthlyIncome } from '@/hooks/useMonthlyIncome';
import { formatCurrency } from '@/helpers/formatCurrency';
import { formatMonthKey } from '@/helpers/formatMonthKey';
import IncomeLineRow from '@/components/income/IncomeLineRow';
import IncomeLineFormDialog from '@/components/income/IncomeLineFormDialog';
import IncomeLineCancelDialog from '@/components/income/IncomeLineCancelDialog';
import type { IncomeLine } from '@/types/income';

interface Props {
  monthKey: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Lists the income lines **in force for the month on screen**, which is why no
 * grouping key is needed: intervals of one line never overlap, so each line
 * shows up exactly once for any given month.
 */
export default function IncomeLinesDialog({ monthKey, isOpen, onClose }: Props) {
  const { t } = useTranslation();
  const { data, isLoading } = useMonthlyIncome(monthKey);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [cancellingLine, setCancellingLine] = useState<IncomeLine | null>(null);

  // Sorted by amount descending, like the category breakdown: the SQL order is
  // by interval start, which would put an old side income above the salary.
  const lines = useMemo(
    () => [...(data?.lines ?? [])].sort((a, b) => b.amount - a.amount),
    [data],
  );

  function renderBody() {
    if (isLoading) {
      return <p className="text-sm text-muted-foreground">{t('common.loading')}</p>;
    }

    if (lines.length === 0) {
      return (
        <div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
          <ArrowDownToLine className="h-10 w-10" />
          <p className="font-medium text-foreground">{t('income.empty')}</p>
          <p className="text-sm">{t('income.emptyHint')}</p>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus /> {t('common.new')}
          </Button>
        </div>
      );
    }

    return (
      <>
        <div className="flex flex-col gap-2">
          {lines.map((line) => (
            <IncomeLineRow key={line.id} line={line} onCancel={setCancellingLine} />
          ))}
        </div>

        <Separator />

        <dl className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('income.label')}</dt>
            <dd className="font-medium tabular-nums">
              {formatCurrency(data?.amount ?? 0)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('income.spentAllSheets')}</dt>
            <dd className="tabular-nums">{formatCurrency(data?.spent ?? 0)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{t('income.remainingLabel')}</dt>
            <dd
              className={`font-semibold tabular-nums ${
                (data?.remaining ?? 0) < 0 ? 'text-destructive' : ''
              }`}
            >
              {formatCurrency(data?.remaining ?? 0)}
            </dd>
          </div>
        </dl>

        <div className="flex justify-end">
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus /> {t('common.new')}
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('income.title')}</DialogTitle>
            <DialogDescription>
              {t('income.description', { month: formatMonthKey(monthKey) })}
            </DialogDescription>
          </DialogHeader>
          {renderBody()}
        </DialogContent>
      </Dialog>

      <IncomeLineFormDialog
        monthKey={monthKey}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />

      <IncomeLineCancelDialog
        line={cancellingLine}
        monthKey={monthKey}
        isOpen={!!cancellingLine}
        onClose={() => setCancellingLine(null)}
      />
    </>
  );
}
