import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/helpers/formatCurrency";
import { calcMonthComparison } from "@/helpers/calcMonthComparison";
import { calcCategoryComparison } from "@/helpers/calcCategoryComparison";
import type { CategoryBreakdown } from "@/types/chartData";
import type { MonthOption } from "@/helpers/getComparisonMonths";
import MonthTotal from "@/components/expenses/MonthTotal";
import MonthComparisonBadge from "@/components/expenses/MonthComparisonBadge";

interface MonthlySummaryProps {
  currentTotal: number;
  currentBreakdown: CategoryBreakdown[];
  comparisonBreakdown: CategoryBreakdown[];
  comparisonMonthKey: string;
  monthOptions: MonthOption[];
  isComparisonLoading: boolean;
  onComparisonMonthChange: (monthKey: string) => void;
}

export default function MonthlySummary({
  currentTotal,
  currentBreakdown,
  comparisonBreakdown,
  comparisonMonthKey,
  monthOptions,
  isComparisonLoading,
  onComparisonMonthChange,
}: MonthlySummaryProps) {
  const comparisonTotal = useMemo(
    () => comparisonBreakdown.reduce((sum, c) => sum + c.amount, 0),
    [comparisonBreakdown],
  );

  const comparison = useMemo(
    () => calcMonthComparison(currentTotal, comparisonTotal),
    [currentTotal, comparisonTotal],
  );

  const comparisonLabel = useMemo(
    () => monthOptions.find((o) => o.key === comparisonMonthKey)?.label ?? "",
    [monthOptions, comparisonMonthKey],
  );

  const items = useMemo(
    () => calcCategoryComparison(currentBreakdown, comparisonBreakdown),
    [currentBreakdown, comparisonBreakdown],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparativa por categoría</CardTitle>
        <div className="flex flex-wrap items-center gap-3">
          <MonthTotal total={currentTotal} />
          <MonthComparisonBadge
            comparison={comparison}
            previousMonthLabel={comparisonLabel}
            isLoading={isComparisonLoading}
          />
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-3 flex items-center justify-between gap-2">
          <Select
            value={comparisonMonthKey}
            onValueChange={onComparisonMonthChange}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((opt) => (
                <SelectItem key={opt.key} value={opt.key}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isComparisonLoading ? (
          <p className="text-sm text-muted-foreground animate-pulse">
            Cargando...
          </p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <ComparisonRow key={item.categoryName} item={item} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

interface ComparisonRowProps {
  item: ReturnType<typeof calcCategoryComparison>[number];
}

function ComparisonRow({ item }: ComparisonRowProps) {
  const { difference, percentageChange } = item;
  const isUp = difference > 0;
  const isDown = difference < 0;
  const isEqual = difference === 0;

  return (
    <li className="flex items-center gap-2 text-sm">
      <span
        className="inline-block size-2 shrink-0 rounded-full"
        style={{ backgroundColor: item.color }}
      />
      <span className="flex-1 truncate">{item.categoryName}</span>
      <span className="tabular-nums">{formatCurrency(item.currentAmount)}</span>
      {isEqual ? (
        <Badge variant="secondary" className="min-w-16 justify-center">
          =
        </Badge>
      ) : (
        <Badge
          variant={isDown ? "default" : "destructive"}
          className="min-w-16 justify-center tabular-nums"
        >
          {isUp ? "+" : ""}
          {formatCurrency(difference)}
          {percentageChange !== null &&
            ` (${Math.abs(percentageChange).toFixed(0)}%)`}
        </Badge>
      )}
    </li>
  );
}
