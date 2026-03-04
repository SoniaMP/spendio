# Phase 2: Charts — Expenses by Category

## Layout

- **Desktop (md+):** Two-column grid — table on the left, chart on the right.
- **Mobile (<md):** Single column — chart on top, table below.

## Dependencies

```bash
npm install recharts
```

## Implementation Steps

### Step 1 — Install recharts

```bash
npm install recharts
```

### Step 2 — Type `src/types/chartData.ts` (~6 LOC)

```typescript
export interface CategoryBreakdown {
  categoryName: string;
  color: string;
  amount: number;
  percentage: number;
}
```

### Step 3 — Helper `src/helpers/groupExpensesByCategory.ts` (~25 LOC)

Pure function: `ExpenseWithCategory[] → CategoryBreakdown[]` sorted by amount desc.
Aggregates amounts per category via `Map`, calculates `(amount / total) * 100`.

### Step 4 — Test `src/__tests__/helpers/groupExpensesByCategory.test.ts`

Covers: aggregation, percentages sum to 100, sorting desc, empty input, single category.
Run `npm test` — green.

### Step 5 — Component `src/components/expenses/ChartTooltip.tsx` (~25 LOC)

Custom recharts tooltip: category name, formatted EUR amount, percentage.

### Step 6 — Test `src/__tests__/components/expenses/ChartTooltip.test.tsx`

Covers: active state renders name/amount/percentage, inactive returns null.

### Step 7 — Component `src/components/expenses/ChartLegend.tsx` (~25 LOC)

2-column grid legend: color dot, category name, formatted amount, percentage.

### Step 8 — Test `src/__tests__/components/expenses/ChartLegend.test.tsx`

Covers: renders all items with correct colors, amounts, percentages.

### Step 9 — Component `src/components/expenses/ExpensePieChart.tsx` (~40 LOC)

Donut chart (`innerRadius=60`) using recharts `PieChart` + `Cell` with category colors.
Uses `ResponsiveContainer` for fluid sizing.

### Step 10 — Component `src/components/expenses/ExpenseBarChart.tsx` (~40 LOC)

Horizontal bar chart (`layout="vertical"`) with category names on Y-axis,
EUR-formatted X-axis. Uses `ResponsiveContainer`.

### Step 11 — Component `src/components/expenses/ExpenseChart.tsx` (~50 LOC)

Container component:
- Title: "Gastos por categoría"
- shadcn `Tabs` toggle: "Circular" (default) / "Barras"
- Renders the active chart + `ChartLegend`
- Calls `groupExpensesByCategory` internally
- Returns `null` when `expenses` is empty

### Step 12 — Test `src/__tests__/components/expenses/ExpenseChart.test.tsx`

Covers: returns null for empty data, tab switching, legend rendering (recharts mocked).

### Step 13 — Modify `src/components/expenses/ExpensesPage.tsx`

Change the layout so that the content area becomes a responsive grid:

```
Desktop (md+):
┌────────────────────────┬──────────────────┐
│  MonthPicker + buttons │                  │
├────────────────────────┤   ExpenseChart   │
│  Table / Empty / Skel  │                  │
└────────────────────────┴──────────────────┘

Mobile:
┌──────────────────────────┐
│  MonthPicker + buttons   │
├──────────────────────────┤
│  ExpenseChart            │
├──────────────────────────┤
│  Table / Empty / Skeleton│
└──────────────────────────┘
```

Concretely, wrap the content below the header in:

```tsx
<div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr,320px]">
  <div className="order-2 md:order-1">
    {renderContent()}
  </div>
  {expenses && expenses.length > 0 && (
    <div className="order-1 md:order-2">
      <ExpenseChart expenses={expenses} />
    </div>
  )}
</div>
```

- `order-1/order-2` ensures chart appears first on mobile, second on desktop.
- Chart column is fixed `320px` on desktop; table takes remaining space.
- Chart only renders when there is data.

### Step 14 — Final verification

```bash
npm run lint   # zero errors
npm test       # all green
```

## Reused Existing Code

| What | From |
|---|---|
| `formatCurrency` | `src/helpers/formatCurrency.ts` |
| `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` | `src/components/ui/tabs.tsx` |
| `makeExpense` factory pattern | `src/__tests__/helpers/exportToExcel.test.ts` |
| `ExpenseWithCategory` type | `src/types/expense.ts` |
