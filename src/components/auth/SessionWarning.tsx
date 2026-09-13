import { Trans, useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SessionWarningProps {
  isOpen: boolean;
  secondsLeft: number;
  onExtend: () => void;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  }
  return `${seconds}s`;
}

export default function SessionWarning({
  isOpen,
  secondsLeft,
  onExtend,
}: SessionWarningProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t('auth.sessionWarning.title')}</DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="auth.sessionWarning.description"
              values={{ time: formatTime(secondsLeft) }}
              components={{
                bold: <span className="font-semibold text-foreground" />,
              }}
            />
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onExtend}>{t('auth.sessionWarning.extend')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
