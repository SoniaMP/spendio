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
  const deleteMutation = useDeleteCategory();

  function handleConfirm() {
    if (!category) return;
    deleteMutation.mutate(category.id, {
      onSuccess: () => {
        toast.success('Categoría eliminada');
        onClose();
      },
      onError: (err) => {
        const message = err.message.toLowerCase().includes('restrict')
          || err.message.toLowerCase().includes('constraint')
          || err.message.toLowerCase().includes('foreign')
          ? 'No se puede eliminar: tiene gastos asociados'
          : err.message;
        toast.error(message);
      },
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar categoría</DialogTitle>
          <DialogDescription>
            ¿Seguro que quieres eliminar <strong>{category?.name}</strong>?
            Si tiene gastos asociados, no se podrá eliminar.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
