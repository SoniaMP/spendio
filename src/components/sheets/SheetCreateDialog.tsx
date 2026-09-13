import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
          <DialogTitle>{t('sheets.new')}</DialogTitle>
          <DialogDescription>
            {t('sheets.createDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sheet-name">{t('common.name')}</Label>
            <Input
              id="sheet-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('sheets.namePlaceholder')}
              autoFocus
            />
          </div>
          <Button type="submit" disabled={!name.trim() || isPending}>
            {isPending ? t('common.creating') : t('common.create')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
