import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { useSheets } from '@/hooks/useSheets';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useSummary } from '@/hooks/useSummary';
import { useSummaryConfig } from '@/hooks/useSummaryConfig';
import { mergeCategoryTotals } from '@/helpers/mergeCategoryTotals';
import MonthPicker from '@/components/layout/MonthPicker';
import SummaryConfig from '@/components/summary/SummaryConfig';
import SheetSummaryCard from '@/components/summary/SheetSummaryCard';
import TotalSummaryCard from '@/components/summary/TotalSummaryCard';

export default function SummaryPage() {
  const { data: sheets } = useSheets();
  const { monthKey, monthLabel, goToPreviousMonth, goToNextMonth } = useMonthFilter();
  const { config, toggleSheet, toggleCategory, selectAllSheets, clearSheets } =
    useSummaryConfig();

  const { data, isLoading } = useSummary(config.selectedSheetIds, monthKey);

  const allCategories = useMemo(
    () => mergeCategoryTotals(data?.sheets ?? []),
    [data],
  );

  const filteredSheets = useMemo(() => {
    if (!data?.sheets) return [];
    if (config.selectedCategoryIds.length === 0) return data.sheets;
    return data.sheets.map((sheet) => ({
      ...sheet,
      categories: sheet.categories.filter((c) =>
        config.selectedCategoryIds.includes(c.categoryId),
      ),
      total: sheet.categories
        .filter((c) => config.selectedCategoryIds.includes(c.categoryId))
        .reduce((sum, c) => sum + c.total, 0),
    }));
  }, [data, config.selectedCategoryIds]);

  const filteredCategories = useMemo(
    () => mergeCategoryTotals(filteredSheets),
    [filteredSheets],
  );

  const grandTotal = filteredCategories.reduce((sum, c) => sum + c.total, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <MonthPicker
          label={monthLabel}
          onPrevious={goToPreviousMonth}
          onNext={goToNextMonth}
        />
      </div>

      <SummaryConfig
        sheets={sheets ?? []}
        selectedSheetIds={config.selectedSheetIds}
        categories={allCategories}
        selectedCategoryIds={config.selectedCategoryIds}
        onToggleSheet={toggleSheet}
        onToggleCategory={toggleCategory}
        onSelectAllSheets={selectAllSheets}
        onClearSheets={clearSheets}
      />

      {isLoading && (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Cargando resumen...
        </p>
      )}

      {!isLoading && config.selectedSheetIds.length === 0 && (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-12">
          <BarChart3 className="h-10 w-10" />
          <p>Selecciona al menos una hoja para ver el resumen.</p>
        </div>
      )}

      {!isLoading && filteredSheets.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSheets.map((sheet) => (
            <SheetSummaryCard key={sheet.sheetId} sheet={sheet} />
          ))}
          <TotalSummaryCard total={grandTotal} categories={filteredCategories} />
        </div>
      )}
    </div>
  );
}
