import { useState, useRef, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  useSheets,
  useCreateSheet,
  useUpdateSheet,
  useDeleteSheet,
  useReorderSheets,
} from '@/hooks/useSheets';
import { useLeaveSheet } from '@/hooks/useSheetShares';
import type { Sheet } from '@/types/sheet';
import SheetTabItem from '@/components/sheets/SheetTabItem';
import SheetCreateDialog from '@/components/sheets/SheetCreateDialog';
import SheetDeleteDialog from '@/components/sheets/SheetDeleteDialog';
import SheetShareDialog from '@/components/sheets/SheetShareDialog';

interface SheetTabsProps {
  activeSheetId: number;
  onSheetChange: (id: number) => void;
}

export default function SheetTabs({
  activeSheetId,
  onSheetChange,
}: SheetTabsProps) {
  const { data: sheets } = useSheets();
  const createMutation = useCreateSheet();
  const updateMutation = useUpdateSheet();
  const deleteMutation = useDeleteSheet();
  const reorderMutation = useReorderSheets();

  const leaveMutation = useLeaveSheet();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingSheet, setDeletingSheet] = useState<Sheet | null>(null);
  const [sharingSheet, setSharingSheet] = useState<Sheet | null>(null);

  const dragItemId = useRef<number | null>(null);
  const dragOverId = useRef<number | null>(null);

  const handleDragStart = useCallback((sheetId: number) => {
    dragItemId.current = sheetId;
  }, []);

  const handleDragOver = useCallback((sheetId: number) => {
    dragOverId.current = sheetId;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (
      dragItemId.current === null ||
      dragOverId.current === null ||
      dragItemId.current === dragOverId.current ||
      !sheets
    ) {
      dragItemId.current = null;
      dragOverId.current = null;
      return;
    }

    const ids = sheets.map((s) => s.id);
    const fromIdx = ids.indexOf(dragItemId.current);
    const toIdx = ids.indexOf(dragOverId.current);
    if (fromIdx === -1 || toIdx === -1) return;

    ids.splice(fromIdx, 1);
    ids.splice(toIdx, 0, dragItemId.current);

    reorderMutation.mutate(ids, {
      onError: (err) => toast.error(err.message),
    });

    dragItemId.current = null;
    dragOverId.current = null;
  }, [sheets, reorderMutation]);

  function handleCreate(name: string) {
    createMutation.mutate(name, {
      onSuccess: (newSheet) => {
        toast.success('Hoja creada');
        setIsCreateOpen(false);
        onSheetChange(newSheet.id);
      },
      onError: (err) => toast.error(err.message),
    });
  }

  function handleRename(id: number, name: string) {
    updateMutation.mutate(
      { id, name },
      {
        onSuccess: () => toast.success('Hoja renombrada'),
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function handleDeleteConfirm() {
    if (!deletingSheet) return;
    const deletedId = deletingSheet.id;
    deleteMutation.mutate(deletedId, {
      onSuccess: () => {
        toast.success('Hoja eliminada');
        setDeletingSheet(null);
        if (activeSheetId === deletedId && sheets) {
          const remaining = sheets.filter((s) => s.id !== deletedId);
          if (remaining.length > 0) onSheetChange(remaining[0].id);
        }
      },
      onError: (err) => toast.error(err.message),
    });
  }

  function handleLeave(sheet: Sheet) {
    leaveMutation.mutate(sheet.id, {
      onSuccess: () => {
        toast.success('Has dejado la hoja');
        if (activeSheetId === sheet.id && sheets) {
          const remaining = sheets.filter((s) => s.id !== sheet.id);
          if (remaining.length > 0) onSheetChange(remaining[0].id);
        }
      },
      onError: (err) => toast.error(err.message),
    });
  }

  if (!sheets) return null;

  return (
    <>
      <div className="flex items-center gap-1 overflow-x-auto rounded-lg bg-muted p-1">
        {sheets.map((sheet) => (
          <SheetTabItem
            key={sheet.id}
            sheet={sheet}
            isActive={sheet.id === activeSheetId}
            permission={sheet.permission}
            onSelect={() => onSheetChange(sheet.id)}
            onRename={(name) => handleRename(sheet.id, name)}
            onDelete={() => setDeletingSheet(sheet)}
            onShare={sheet.permission === 'owner' ? () => setSharingSheet(sheet) : undefined}
            onLeave={sheet.permission !== 'owner' ? () => handleLeave(sheet) : undefined}
            onDragStart={() => handleDragStart(sheet.id)}
            onDragOver={() => handleDragOver(sheet.id)}
            onDragEnd={handleDragEnd}
          />
        ))}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <SheetCreateDialog
        isOpen={isCreateOpen}
        isPending={createMutation.isPending}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <SheetDeleteDialog
        sheet={deletingSheet}
        isOpen={!!deletingSheet}
        isPending={deleteMutation.isPending}
        onClose={() => setDeletingSheet(null)}
        onConfirm={handleDeleteConfirm}
      />

      {sharingSheet && (
        <SheetShareDialog
          sheet={sharingSheet}
          isOpen={!!sharingSheet}
          onClose={() => setSharingSheet(null)}
        />
      )}
    </>
  );
}
