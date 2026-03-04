import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MonthPickerProps {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
}

export default function MonthPicker({
  label,
  onPrevious,
  onNext,
}: MonthPickerProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon-sm"
        onClick={onPrevious}
        aria-label="Mes anterior"
      >
        <ChevronLeft />
      </Button>
      <span className="min-w-[8rem] text-center text-sm font-medium capitalize sm:min-w-[10rem]">
        {label}
      </span>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={onNext}
        aria-label="Mes siguiente"
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
