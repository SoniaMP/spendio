import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePreset } from '@/helpers/dateHelpers';

interface DateRangeFilterProps {
  preset: DatePreset;
  from: string;
  to: string;
  onPresetChange: (preset: DatePreset) => void;
  onCustomRangeChange: (from: string, to: string) => void;
}

const PRESET_OPTIONS: { value: DatePreset; label: string }[] = [
  { value: DatePreset.ThisMonth, label: 'Este mes' },
  { value: DatePreset.Last3Months, label: 'Últimos 3 meses' },
  { value: DatePreset.ThisYear, label: 'Año actual' },
];

export default function DateRangeFilter({
  preset,
  from,
  to,
  onPresetChange,
  onCustomRangeChange,
}: DateRangeFilterProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {PRESET_OPTIONS.map((option) => (
          <Button
            key={option.value}
            size="sm"
            variant={preset === option.value ? 'default' : 'outline'}
            onClick={() => onPresetChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          Desde
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => onCustomRangeChange(e.target.value, to)}
            className="h-8 rounded-md border bg-background px-2 text-sm"
          />
        </Label>
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          Hasta
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => onCustomRangeChange(from, e.target.value)}
            className="h-8 rounded-md border bg-background px-2 text-sm"
          />
        </Label>
      </div>
    </div>
  );
}
