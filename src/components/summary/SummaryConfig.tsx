import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
  onSelectAllCategories: (ids: number[]) => void;
  onClearCategories: () => void;
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
  onSelectAllCategories,
  onClearCategories,
}: SummaryConfigProps) {
  const allSheetsSelected = sheets.length > 0 && selectedSheetIds.length === sheets.length;
  const someSheetsSelected = selectedSheetIds.length > 0 && !allSheetsSelected;

  const allCategoryIds = categories.map((c) => c.categoryId);
  const allCategoriesSelected = categories.length > 0
    && selectedCategoryIds.length === categories.length;
  const someCategoriesSelected = selectedCategoryIds.length > 0 && !allCategoriesSelected;

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:gap-8">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Hojas</span>
        <div className="flex flex-wrap gap-3">
          <Label className="flex items-center gap-1.5 text-sm font-medium">
            <Checkbox
              checked={allSheetsSelected ? true : someSheetsSelected ? 'indeterminate' : false}
              onCheckedChange={(checked) =>
                checked
                  ? onSelectAllSheets(sheets.map((s) => s.id))
                  : onClearSheets()
              }
            />
            Todas
          </Label>
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
        <div className="border-t pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-8" />
      )}

      {categories.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Categorías</span>
          <div className="flex flex-wrap gap-3">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <Checkbox
                checked={allCategoriesSelected ? true : someCategoriesSelected ? 'indeterminate' : false}
                onCheckedChange={(checked) =>
                  checked
                    ? onSelectAllCategories(allCategoryIds)
                    : onClearCategories()
                }
              />
              Todas
            </Label>
            {categories.map((cat) => (
              <Label
                key={cat.categoryId}
                className="flex items-center gap-1.5 text-sm font-normal"
              >
                <Checkbox
                  checked={selectedCategoryIds.includes(cat.categoryId)}
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
