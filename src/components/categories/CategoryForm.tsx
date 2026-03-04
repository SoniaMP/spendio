import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CategoryFormProps {
  initialValues?: { name: string; color: string };
  onSubmit: (values: { name: string; color: string }) => void;
  isPending: boolean;
}

const DEFAULT_COLOR = '#6B7280';

export default function CategoryForm({
  initialValues,
  onSubmit,
  isPending,
}: CategoryFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [color, setColor] = useState(initialValues?.color ?? DEFAULT_COLOR);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({ name: trimmed, color });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="category-name">Nombre</Label>
        <Input
          id="category-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Alimentación"
          required
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="category-color">Color</Label>
        <div className="flex items-center gap-3">
          <input
            id="category-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-9 w-12 cursor-pointer rounded-md border border-input"
          />
          <span className="text-sm text-muted-foreground">{color}</span>
        </div>
      </div>

      <Button type="submit" disabled={isPending || !name.trim()}>
        {isPending ? 'Guardando...' : 'Guardar'}
      </Button>
    </form>
  );
}
