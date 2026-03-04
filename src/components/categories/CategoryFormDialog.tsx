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
            toast.success('Categoría actualizada');
            onClose();
          },
          onError: (err) => toast.error(err.message),
        },
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success('Categoría creada');
          onClose();
        },
        onError: (err) => toast.error(err.message),
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar categoría' : 'Nueva categoría'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los datos de la categoría.'
              : 'Añade una nueva categoría de gastos.'}
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
