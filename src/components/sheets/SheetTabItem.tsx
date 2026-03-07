import { useState, useRef, useEffect } from "react";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  LogOut,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Sheet, SheetPermission } from "@/types/sheet";

interface SheetTabItemProps {
  sheet: Sheet;
  isActive: boolean;
  permission: SheetPermission;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onShare?: () => void;
  onLeave?: () => void;
  onDragStart?: () => void;
  onDragOver?: () => void;
  onDragEnd?: () => void;
}

export default function SheetTabItem({
  sheet,
  isActive,
  permission,
  onSelect,
  onRename,
  onDelete,
  onShare,
  onLeave,
  onDragStart,
  onDragOver,
  onDragEnd,
}: SheetTabItemProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(sheet.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) inputRef.current?.select();
  }, [isRenaming]);

  function handleRenameSubmit() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== sheet.name) {
      onRename(trimmed);
    }
    setIsRenaming(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleRenameSubmit();
    if (e.key === "Escape") {
      setRenameValue(sheet.name);
      setIsRenaming(false);
    }
  }

  if (isRenaming) {
    return (
      <Input
        ref={inputRef}
        value={renameValue}
        onChange={(e) => setRenameValue(e.target.value)}
        onBlur={handleRenameSubmit}
        onKeyDown={handleKeyDown}
        className="h-7 w-28 text-sm"
      />
    );
  }

  return (
    <div
      className="group flex items-center gap-0.5"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.();
      }}
      onDragEnd={() => onDragEnd?.()}
    >
      <button
        onClick={onSelect}
        className={`flex items-center gap-1 rounded-md px-3 py-1 text-sm font-medium transition-colors ${
          isActive
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {(permission !== "owner" || sheet.has_shares > 0) && (
          <Users className="h-3 w-3 mr-1" />
        )}
        {sheet.name}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-auto">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {permission !== "read" && (
              <DropdownMenuItem
                onClick={() => {
                  setRenameValue(sheet.name);
                  setIsRenaming(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Renombrar
              </DropdownMenuItem>
            )}
            {permission === "owner" && onShare && (
              <DropdownMenuItem onClick={onShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Compartir
              </DropdownMenuItem>
            )}
            {permission === "owner" ? (
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            ) : (
              onLeave && (
                <DropdownMenuItem
                  onClick={onLeave}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Dejar hoja
                </DropdownMenuItem>
              )
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </button>
    </div>
  );
}
