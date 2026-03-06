import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useSheetShares,
  useCreateSheetShare,
  useUpdateSheetShare,
  useDeleteSheetShare,
} from '@/hooks/useSheetShares';
import type { Sheet } from '@/types/sheet';

interface SheetShareDialogProps {
  sheet: Sheet;
  isOpen: boolean;
  onClose: () => void;
}

export default function SheetShareDialog({ sheet, isOpen, onClose }: SheetShareDialogProps) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'read' | 'edit'>('read');

  const { data: shares } = useSheetShares(sheet.id);
  const createMutation = useCreateSheetShare(sheet.id);
  const updateMutation = useUpdateSheetShare(sheet.id);
  const deleteMutation = useDeleteSheetShare(sheet.id);

  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent, confirm?: boolean) {
    e.preventDefault();
    const targetEmail = confirm ? pendingEmail : email.trim();
    if (!targetEmail) return;

    createMutation.mutate(
      { email: targetEmail, permission, confirm },
      {
        onSuccess: (data) => {
          if (data.needsConfirmation) {
            setPendingEmail(data.email ?? targetEmail);
            return;
          }
          toast.success('Hoja compartida');
          setEmail('');
          setPendingEmail(null);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Compartir &quot;{sheet.name}&quot;</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => handleSubmit(e)} className="flex gap-2">
          <Input
            type="email"
            placeholder="Email del usuario"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Select value={permission} onValueChange={(v) => setPermission(v as 'read' | 'edit')}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="read">Lectura</SelectItem>
              <SelectItem value="edit">Editar</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={createMutation.isPending}>
            Compartir
          </Button>
        </form>

        {pendingEmail && (
          <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm dark:border-yellow-700 dark:bg-yellow-950">
            <p className="text-yellow-800 dark:text-yellow-200">
              <strong>{pendingEmail}</strong> no tiene cuenta. Se le compartira cuando se registre.
            </p>
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)}
                disabled={createMutation.isPending}
              >
                Confirmar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPendingEmail(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {shares && shares.length > 0 && (
          <ShareList
            shares={shares}
            onUpdate={(shareId, perm) =>
              updateMutation.mutate(
                { shareId, permission: perm },
                { onError: (err) => toast.error(err.message) },
              )
            }
            onDelete={(shareId) =>
              deleteMutation.mutate(shareId, {
                onSuccess: () => toast.success('Acceso revocado'),
                onError: (err) => toast.error(err.message),
              })
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ShareListProps {
  shares: Array<{ id: number; name: string; email: string; picture: string; permission: 'read' | 'edit' }>;
  onUpdate: (shareId: number, permission: 'read' | 'edit') => void;
  onDelete: (shareId: number) => void;
}

function ShareList({ shares, onUpdate, onDelete }: ShareListProps) {
  return (
    <ul className="mt-2 space-y-2">
      {shares.map((share) => (
        <li key={share.id} className="flex items-center gap-2">
          {share.picture ? (
            <img
              src={share.picture}
              alt={share.name}
              className="h-6 w-6 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
              {share.name[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium">{share.name}</p>
            <p className="truncate text-xs text-muted-foreground">{share.email}</p>
          </div>
          <Select
            value={share.permission}
            onValueChange={(v) => onUpdate(share.id, v as 'read' | 'edit')}
          >
            <SelectTrigger className="h-8 w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="read">Lectura</SelectItem>
              <SelectItem value="edit">Editar</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon-xs" onClick={() => onDelete(share.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
