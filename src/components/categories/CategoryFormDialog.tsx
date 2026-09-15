import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useCreateCategory, useUpdateCategory } from '@/hooks/useCategories';
import type { Category } from '@/types/category';
import CategoryForm from '@/components/categories/CategoryForm';
import { getErrorMessage } from '@/lib/errorMessage';

interface CategoryFormDialogProps {
  category?: Category;
  isOpen: boolean;
  onClose: () => void;
}

export default function CategoryFormDialog({
  category,
  isOpen,
  onClose,
}: CategoryFormDialogProps) {
  const { t } = useTranslation();
  const isEditing = !!category;
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(values: { name: string; color: string }) {
    if (isEditing) {
      updateMutation.mutate(
        { id: category.id, ...values },
        {
          onSuccess: () => {
            toast.success(t('categories.updated'));
            onClose();
          },
          onError: (err) => toast.error(getErrorMessage(err)),
        },
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success(t('categories.created'));
          onClose();
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('categories.form.editTitle') : t('categories.form.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t('categories.form.editDescription')
              : t('categories.form.createDescription')}
          </DialogDescription>
        </DialogHeader>
        <CategoryForm
          initialValues={
            category ? { name: category.name, color: category.color } : undefined
          }
          onSubmit={handleSubmit}
          isPending={isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
