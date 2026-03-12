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
  return (
    <Dialog open={isOpen}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>La sesión va a caducar</DialogTitle>
          <DialogDescription>
            Tu sesión expirará en{' '}
            <span className="font-semibold text-foreground">
              {formatTime(secondsLeft)}
            </span>{' '}
            por inactividad. Pulsa el botón para continuar.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onExtend}>Continuar sesión</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
