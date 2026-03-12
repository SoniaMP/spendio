import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/helpers/formatCurrency';
import type { SheetSummary } from '@/types/summary';

interface SheetSummaryCardProps {
  sheet: SheetSummary;
}

export default function SheetSummaryCard({ sheet }: SheetSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{sheet.sheetName}</CardTitle>
          <span className="text-lg font-bold">{formatCurrency(sheet.total)}</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {sheet.categories.map((cat) => {
          const percentage = sheet.total > 0 ? (cat.total / sheet.total) * 100 : 0;
          return (
            <div key={cat.categoryId} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: cat.categoryColor }}
                  />
                  <span>{cat.categoryName}</span>
                </div>
                <span className="text-muted-foreground">
                  {formatCurrency(cat.total)}
                </span>
              </div>
              <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: cat.categoryColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
