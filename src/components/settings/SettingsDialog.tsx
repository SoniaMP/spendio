import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CategoriesPage from '@/components/categories/CategoriesPage';
import LanguageSelector from '@/components/settings/LanguageSelector';

const SettingsTab = {
  Categories: 'categories',
  Language: 'language',
} as const;

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('settings.title')}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={SettingsTab.Categories} className="min-h-0 flex-1">
          <TabsList>
            <TabsTrigger value={SettingsTab.Categories}>
              {t('settings.tabs.categories')}
            </TabsTrigger>
            <TabsTrigger value={SettingsTab.Language}>
              {t('settings.tabs.language')}
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value={SettingsTab.Categories}
            className="-mx-6 overflow-y-auto overscroll-contain px-6"
          >
            <CategoriesPage />
          </TabsContent>
          <TabsContent
            value={SettingsTab.Language}
            className="-mx-6 overflow-y-auto px-6 pt-2"
          >
            <LanguageSelector />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
