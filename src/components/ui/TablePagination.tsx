import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type PageSizeOption = 5 | 10 | 25 | 'all';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: PageSizeOption;
  pageSizeOptions: readonly PageSizeOption[];
  canGoPrevious: boolean;
  canGoNext: boolean;
  canGoFirst: boolean;
  canGoLast: boolean;
  onFirst: () => void;
  onLast: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onPageSizeChange: (size: PageSizeOption) => void;
}

const PAGE_SIZE_LABELS: Record<string, string> = {
  '5': '5',
  '10': '10',
  '25': '25',
  all: 'Todos',
};

export default function TablePagination({
  currentPage,
  totalPages,
  pageSize,
  pageSizeOptions,
  canGoPrevious,
  canGoNext,
  canGoFirst,
  canGoLast,
  onFirst,
  onLast,
  onPrevious,
  onNext,
  onPageSizeChange,
}: TablePaginationProps) {
  return (
    <div className="flex items-center justify-end gap-1 pt-2">
      <Button
        variant="outline"
        size="icon-sm"
        disabled={!canGoFirst}
        onClick={onFirst}
        aria-label="Primera página"
      >
        <ChevronsLeft />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        disabled={!canGoPrevious}
        onClick={onPrevious}
        aria-label="Página anterior"
      >
        <ChevronLeft />
      </Button>
      <Select
        value={String(pageSize)}
        onValueChange={(v) =>
          onPageSizeChange(v === 'all' ? 'all' : (Number(v) as 5 | 10 | 25))
        }
      >
        <SelectTrigger size="sm" aria-label="Filas por página">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {pageSizeOptions.map((opt) => (
            <SelectItem key={String(opt)} value={String(opt)}>
              {PAGE_SIZE_LABELS[String(opt)]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="icon-sm"
        disabled={!canGoNext}
        onClick={onNext}
        aria-label="Página siguiente"
      >
        <ChevronRight />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        disabled={!canGoLast}
        onClick={onLast}
        aria-label="Última página"
      >
        <ChevronsRight />
      </Button>
    </div>
  );
}
