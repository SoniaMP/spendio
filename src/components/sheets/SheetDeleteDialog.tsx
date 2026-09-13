import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Sheet } from '@/types/sheet';

interface SheetDeleteDialogProps {
  sheet: Sheet | null;
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function SheetDeleteDialog({
  sheet,
  isOpen,
  isPending,
  onClose,
  onConfirm,
}: SheetDeleteDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('sheets.delete.title')}</DialogTitle>
          <DialogDescription>
            {t('sheets.delete.confirm', { name: sheet?.name ?? '' })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? t('common.deleting') : t('common.delete')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
