import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/hooks/useCategories';
import type { Category } from '@/types/category';
import CategoriesTable from '@/components/categories/CategoriesTable';
import CategoryFormDialog from '@/components/categories/CategoryFormDialog';
import CategoryDeleteDialog from '@/components/categories/CategoryDeleteDialog';

export default function CategoriesPage() {
  const { data: categories, isLoading, isError } = useCategories();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  function handleEdit(category: Category) {
    setEditingCategory(category);
    setIsFormOpen(true);
  }

  function handleCloseForm() {
    setIsFormOpen(false);
    setEditingCategory(undefined);
  }

  if (isLoading) {
    return <p className="text-muted-foreground">Cargando categorías...</p>;
  }

  if (isError) {
    return <p className="text-destructive">Error al cargar las categorías.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Categorías</h2>
        <Button size="sm" onClick={() => setIsFormOpen(true)}>
          <Plus /> Nueva categoría
        </Button>
      </div>

      {categories && categories.length > 0 ? (
        <CategoriesTable
          categories={categories}
          onEdit={handleEdit}
          onDelete={setDeletingCategory}
        />
      ) : (
        <p className="text-muted-foreground">
          No hay categorías. Crea la primera para empezar.
        </p>
      )}

      <CategoryFormDialog
        category={editingCategory}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
      />

      <CategoryDeleteDialog
        category={deletingCategory}
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
      />
    </div>
  );
}
