import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SheetCreateDialogProps {
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export default function SheetCreateDialog({
  isOpen,
  isPending,
  onClose,
  onSubmit,
}: SheetCreateDialogProps) {
  const [name, setName] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim()) onSubmit(name.trim());
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setName('');
      onClose();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva hoja</DialogTitle>
          <DialogDescription>
            Crea una nueva hoja para organizar tus gastos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sheet-name">Nombre</Label>
            <Input
              id="sheet-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Tarjeta, Efectivo..."
              autoFocus
            />
          </div>
          <Button type="submit" disabled={!name.trim() || isPending}>
            {isPending ? 'Creando...' : 'Crear'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
