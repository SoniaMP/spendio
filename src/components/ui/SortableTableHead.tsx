import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { TableHead } from '@/components/ui/table';

interface SortableTableHeadProps {
  children: React.ReactNode;
  isActive: boolean;
  direction: 'asc' | 'desc';
  onToggle: () => void;
  className?: string;
}

export default function SortableTableHead({
  children,
  isActive,
  direction,
  onToggle,
  className,
}: SortableTableHeadProps) {
  const icon = isActive
    ? direction === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
    : <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;

  return (
    <TableHead className={className}>
      <button
        type="button"
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
        onClick={onToggle}
      >
        {children}
        {icon}
      </button>
    </TableHead>
  );
}
