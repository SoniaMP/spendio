import { Trans, useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useDeleteCategory } from '@/hooks/useCategories';
import type { Category } from '@/types/category';
import { getErrorMessage, isErrorCode } from '@/lib/errorMessage';
import { ErrorCode } from '@shared/errorCodes';

interface CategoryDeleteDialogProps {
  category: Category | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CategoryDeleteDialog({
  category,
  isOpen,
  onClose,
}: CategoryDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeleteCategory();

  function handleConfirm() {
    if (!category) return;
    deleteMutation.mutate(category.id, {
      onSuccess: () => {
        toast.success(t('categories.deleted'));
        onClose();
      },
      onError: (err) => {
        // The server distinguishes this case now, so no message sniffing.
        const isBlocked =
          isErrorCode(err, ErrorCode.CategoryHasExpenses) ||
          isErrorCode(err, ErrorCode.ConstraintViolation);
        toast.error(
          isBlocked ? t('categories.deleteBlocked') : getErrorMessage(err),
        );
      },
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('categories.delete.title')}</DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="categories.delete.confirm"
              values={{ name: category?.name ?? '' }}
              components={{ name: <strong /> }}
            />
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? t('common.deleting') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
