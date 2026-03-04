import { useState } from 'react';
import { FolderOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/hooks/useCategories';
import type { Category } from '@/types/category';
import CategoriesTable from '@/components/categories/CategoriesTable';
import CategoriesTableSkeleton from '@/components/categories/CategoriesTableSkeleton';
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

  function renderContent() {
    if (isLoading) return <CategoriesTableSkeleton />;

    if (isError) {
      return (
        <p className="py-8 text-center text-destructive">
          Error al cargar las categorías.
        </p>
      );
    }

    if (!categories || categories.length === 0) {
      return (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <FolderOpen className="h-10 w-10" />
          <p>No hay categorías. Crea la primera para empezar.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFormOpen(true)}
          >
            <Plus /> Nueva categoría
          </Button>
        </div>
      );
    }

    return (
      <CategoriesTable
        categories={categories}
        onEdit={handleEdit}
        onDelete={setDeletingCategory}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Categorías</h2>
        <Button size="sm" onClick={() => setIsFormOpen(true)}>
          <Plus /> Nueva categoría
        </Button>
      </div>

      {renderContent()}

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
