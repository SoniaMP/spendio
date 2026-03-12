import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { Sheet } from '@/types/sheet';
import type { CategoryTotal } from '@/types/summary';

interface SummaryConfigProps {
  sheets: Sheet[];
  selectedSheetIds: number[];
  categories: CategoryTotal[];
  selectedCategoryIds: number[];
  onToggleSheet: (id: number) => void;
  onToggleCategory: (id: number) => void;
  onSelectAllSheets: (ids: number[]) => void;
  onClearSheets: () => void;
}

export default function SummaryConfig({
  sheets,
  selectedSheetIds,
  categories,
  selectedCategoryIds,
  onToggleSheet,
  onToggleCategory,
  onSelectAllSheets,
  onClearSheets,
}: SummaryConfigProps) {
  const allSheetsSelected = sheets.length > 0 && selectedSheetIds.length === sheets.length;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Hojas</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-1 py-0 text-xs"
            onClick={() =>
              allSheetsSelected
                ? onClearSheets()
                : onSelectAllSheets(sheets.map((s) => s.id))
            }
          >
            {allSheetsSelected ? 'Ninguna' : 'Todas'}
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          {sheets.map((sheet) => (
            <Label
              key={sheet.id}
              className="flex items-center gap-1.5 text-sm font-normal"
            >
              <Checkbox
                checked={selectedSheetIds.includes(sheet.id)}
                onCheckedChange={() => onToggleSheet(sheet.id)}
              />
              {sheet.name}
            </Label>
          ))}
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Categorías</span>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <Label
                key={cat.categoryId}
                className="flex items-center gap-1.5 text-sm font-normal"
              >
                <Checkbox
                  checked={
                    selectedCategoryIds.length === 0 ||
                    selectedCategoryIds.includes(cat.categoryId)
                  }
                  onCheckedChange={() => onToggleCategory(cat.categoryId)}
                />
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: cat.categoryColor }}
                />
                {cat.categoryName}
              </Label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
