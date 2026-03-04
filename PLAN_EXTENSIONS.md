# Phase 3: Summary Strip + Category Filter

## Context

The expenses page shows a table and chart but lacks a quick overview of the month's spending. We're adding 4 features: a monthly total, a comparison vs the previous month, top 3 categories, and a category filter for the table. All grouped into a **SummaryStrip** component between the top bar and the grid.

## Layout After Changes

```
┌─ MonthPicker ──────────────── CategoryFilter · ExportBtn · NuevoGasto ─┐
├─ SummaryStrip ─────────────────────────────────────────────────────────┤
│  Total del mes    ▲ 12% vs feb  │  🔴 Comida 450€  🟢 Transp 200€ …  │
├────────────────────────────────────┬───────────────────────────────────┤
│  Table (filtered)                  │  Chart (filtered)                 │
└────────────────────────────────────┴───────────────────────────────────┘
```

## Dependencies

```bash
npx shadcn@latest add select
```

## Implementation Steps

### Step 1 — Helper `getPreviousMonth` in `src/helpers/dateHelpers.ts`

Add pure function `getPreviousMonth(year, month) → { year, month }` (~5 LOC).
Add tests in `src/__tests__/helpers/dateHelpers.test.ts`.

### Step 2 — Extend `src/hooks/useMonthFilter.ts`

Add `previousMonthKey` and `previousMonthLabel` to return value using `getPreviousMonth` + existing `getMonthKey`/`getMonthLabel`.
Update `MonthFilter` interface. Add tests for January→December wrap.

### Step 3 — Helper `src/helpers/calcMonthTotal.ts` (new, ~8 LOC)

`calcMonthTotal(expenses: ExpenseWithCategory[]): number` — sums `amount`.
Test: `src/__tests__/helpers/calcMonthTotal.test.ts` — empty, single, multiple.

### Step 4 — Helper `src/helpers/calcMonthComparison.ts` (new, ~20 LOC)

```typescript
export interface MonthComparison {
  percentageChange: number;
  direction: 'up' | 'down' | 'equal';
}

export function calcMonthComparison(
  currentTotal: number,
  previousTotal: number,
): MonthComparison
```

Edge cases: both zero → equal; previous zero → show "Sin datos" in UI.
Test: `src/__tests__/helpers/calcMonthComparison.test.ts`.

### Step 5 — Component `src/components/expenses/MonthTotal.tsx` (new, ~20 LOC)

Props: `{ total: number }`. Renders label "Total del mes" + formatted amount (bold, `text-xl`).
Reuses: `formatCurrency` from `src/helpers/formatCurrency.ts`.
Test: `src/__tests__/components/expenses/MonthTotal.test.tsx`.

### Step 6 — Component `src/components/expenses/MonthComparisonBadge.tsx` (new, ~35 LOC)

Props: `{ comparison: MonthComparison; previousMonthLabel: string; isLoading: boolean }`.
Shows Badge: green for `down` (spending less = good), red for `up`, neutral for `equal`.
Text: `"▼ 5,0% vs ene"`. Loading: skeleton/muted text.
Previous zero: `"Sin datos de {month}"`.
Reuses: `Badge` from `src/components/ui/badge.tsx`.
Test: `src/__tests__/components/expenses/MonthComparisonBadge.test.tsx`.

### Step 7 — Component `src/components/expenses/TopCategories.tsx` (new, ~35 LOC)

Props: `{ categories: CategoryBreakdown[] }`. Takes first 3, renders as outline Badges with color dot + name + amount.
Reuses: `Badge`, `formatCurrency`, `CategoryBreakdown` type from `src/types/chartData.ts`.
Test: `src/__tests__/components/expenses/TopCategories.test.tsx`.

### Step 8 — Component `src/components/expenses/SummaryStrip.tsx` (new, ~40 LOC)

Composes `MonthTotal`, `MonthComparisonBadge`, `TopCategories` in a `flex-wrap` row with `rounded-lg border bg-card p-4`.
Props: `{ currentTotal, comparison, previousMonthLabel, isComparisonLoading, topCategories }`.
Test: `src/__tests__/components/expenses/SummaryStrip.test.tsx`.

### Step 9 — Install Select + Component `src/components/expenses/CategoryFilter.tsx` (new, ~45 LOC)

Run `npx shadcn@latest add select`.
Filter dropdown: "Todas las categorías" (null) + one item per category with color dot.
Props: `{ value: number | null; onChange: (id: number | null) => void }`.
Reuses: `useCategories` from `src/hooks/useCategories.ts`.
Test: `src/__tests__/components/expenses/CategoryFilter.test.tsx`.

### Step 10 — Integrate in `src/components/expenses/ExpensesPage.tsx`

Key changes (current: 110 LOC → ~140 LOC, under 150 limit):
- Second query: `useExpenses(previousMonthKey)` for comparison data
- State: `filterCategoryId` (reset to `null` on `monthKey` change via `useEffect`)
- Derived (via `useMemo`): `currentTotal`, `previousTotal`, `comparison`, `categoryBreakdown`, `filteredExpenses`
- JSX: Add `SummaryStrip` between top bar and grid; add `CategoryFilter` in top bar; pass `filteredExpenses` to table and chart
- **SummaryStrip uses unfiltered data** (full month picture); table + chart respond to filter

### Step 11 — Final verification

```bash
npm run lint   # zero errors
npm test       # all green
```

## Files Modified

| File | Action |
|------|--------|
| `src/helpers/dateHelpers.ts` | Add `getPreviousMonth` |
| `src/hooks/useMonthFilter.ts` | Add `previousMonthKey`, `previousMonthLabel` |
| `src/helpers/calcMonthTotal.ts` | New |
| `src/helpers/calcMonthComparison.ts` | New |
| `src/components/expenses/MonthTotal.tsx` | New |
| `src/components/expenses/MonthComparisonBadge.tsx` | New |
| `src/components/expenses/TopCategories.tsx` | New |
| `src/components/expenses/SummaryStrip.tsx` | New |
| `src/components/expenses/CategoryFilter.tsx` | New |
| `src/components/expenses/ExpensesPage.tsx` | Modify (integration) |

## Reused Existing Code

| What | From |
|------|------|
| `formatCurrency` | `src/helpers/formatCurrency.ts` |
| `groupExpensesByCategory` | `src/helpers/groupExpensesByCategory.ts` |
| `Badge` | `src/components/ui/badge.tsx` |
| `getMonthKey` / `getMonthLabel` | `src/helpers/dateHelpers.ts` |
| `useExpenses` | `src/hooks/useExpenses.ts` |
| `useCategories` | `src/hooks/useCategories.ts` |
| `CategoryBreakdown` | `src/types/chartData.ts` |
