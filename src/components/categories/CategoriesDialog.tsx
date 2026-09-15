import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import CategoriesPage from '@/components/categories/CategoriesPage';

interface CategoriesDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CategoriesDialog({
  isOpen,
  onClose,
}: CategoriesDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('categories.title')}</DialogTitle>
        </DialogHeader>
        <div className="-mx-6 flex-1 overflow-y-auto overscroll-contain px-6">
          <CategoriesPage />
        </div>
      </DialogContent>
    </Dialog>
  );
}
