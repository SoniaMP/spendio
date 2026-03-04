# Personal Finances App - Implementation Plan

## Context

Build a simple personal finance app to replace an Excel spreadsheet. The app tracks monthly expenses by category, allows CRUD on both expenses and categories, and exports to Excel. Architecture should support future additions: charts (Phase 2) and auth (Phase 3).

## Tech Stack

- **Frontend**: Vite + React + TypeScript
- **Database/API**: Supabase (hosted PostgreSQL + REST API)
- **UI**: shadcn/ui + Tailwind CSS
- **Currency**: EUR (€), locale `es-ES`
- **Deploy**: Vercel or Netlify (static SPA)

## Database Schema (Supabase)

### `categories` table
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | `gen_random_uuid()` |
| name | text UNIQUE NOT NULL | |
| color | text NOT NULL | default `#6B7280`, for Phase 2 charts |
| created_at | timestamptz | default `now()` |
| updated_at | timestamptz | auto-trigger |

### `expenses` table
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | `gen_random_uuid()` |
| amount | numeric(12,2) NOT NULL | `CHECK (amount > 0)` |
| description | text NOT NULL | default `''` |
| date | date NOT NULL | default `current_date` |
| category_id | uuid FK NOT NULL | references `categories(id) ON DELETE RESTRICT` |
| created_at | timestamptz | default `now()` |
| updated_at | timestamptz | auto-trigger |

- RLS enabled with permissive policies (open for Phase 1, lock down in Phase 3 with `auth.uid()`)
- Indexes on `expenses.date` and `expenses.category_id`
- Seed categories: Alimentación, Transporte, Vivienda, Suministros, Ocio, Salud, Educación, Otros

## Project Structure

```
src/
  lib/
    supabase.ts              # Supabase client singleton
    queryClient.ts           # TanStack Query config
    utils.ts                 # cn() helper (shadcn)
  types/
    category.ts              # Category, CategoryInsert, CategoryUpdate
    expense.ts               # Expense, ExpenseInsert, ExpenseWithCategory
  api/
    categories.ts            # CRUD functions (snake_case -> camelCase mapping)
    expenses.ts              # CRUD + fetchByMonth (joins category)
  hooks/
    useCategories.ts         # useQuery + useMutation wrappers
    useExpenses.ts           # useQuery + useMutation wrappers
    useMonthFilter.ts        # year/month state + navigation helpers
  helpers/
    formatCurrency.ts        # number -> "1.234,50 €" (es-ES)
    formatDate.ts            # date -> locale string
    dateHelpers.ts           # getMonthRange, getMonthLabel
    exportToExcel.ts         # xlsx export logic
  components/
    ui/                      # shadcn/ui generated (auto-managed)
    layout/
      AppLayout.tsx          # Header + nav tabs + content area
      MonthPicker.tsx        # < March 2026 > selector
    expenses/
      ExpensesPage.tsx       # Page: month picker + table + export btn
      ExpensesTable.tsx      # Table rendering
      ExpenseRow.tsx         # Row with edit/delete actions
      ExpenseFormDialog.tsx  # Dialog wrapping ExpenseForm
      ExpenseForm.tsx        # Form fields: amount, description, date, category
      ExpenseDeleteDialog.tsx
      ExportButton.tsx
    categories/
      CategoriesPage.tsx     # Page: table + add btn
      CategoriesTable.tsx
      CategoryRow.tsx
      CategoryFormDialog.tsx
      CategoryForm.tsx
      CategoryDeleteDialog.tsx
      CategoryCombobox.tsx   # Searchable select + inline "Create new" option
  __tests__/                 # Mirrors src/ structure
  App.tsx                    # Router + providers
  main.tsx                   # Entry point
```

## Key Dependencies

| Package | Purpose |
|---|---|
| `react-router-dom` | 2 routes: `/expenses`, `/categories` |
| `@supabase/supabase-js` | Supabase client |
| `@tanstack/react-query` | Server state, caching, mutations |
| `date-fns` | Month filtering, date formatting |
| `xlsx` | Excel export |
| `sonner` | Toast notifications (shadcn integration) |
| `vitest` + `@testing-library/react` | Testing |

## Key Design Decisions

- **State management**: TanStack Query only (no Redux/Zustand). All state is server state.
- **Form handling**: Controlled inputs, no form library (only 4-5 fields per form).
- **snake_case -> camelCase**: Mapped once in `api/` layer. Rest of app uses camelCase.
- **Inline category creation**: `CategoryCombobox` uses shadcn's Popover+Command. When user types a name that doesn't exist, a "Create [name]" option appears.
- **Delete protection**: `ON DELETE RESTRICT` prevents deleting categories with expenses. UI shows a warning.

## Implementation Steps

### Step 1: Project Scaffolding
- `npm create vite@latest` with react-ts template
- Install & configure: Tailwind CSS v4, shadcn/ui, TypeScript path aliases (`@/*`)
- Install all dependencies
- Set up Vitest + testing-library
- `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Init git

### Step 2: Supabase Setup
- Create project on Supabase dashboard (manual step by user)
- SQL migrations for both tables + triggers + RLS + indexes
- Seed default categories

### Step 3: Foundation Layer
- `lib/supabase.ts`, `lib/queryClient.ts`, `lib/utils.ts`
- Type definitions in `types/`
- Helper functions in `helpers/` + tests for each

### Step 4: API + Hooks Layer
- `api/categories.ts` and `api/expenses.ts` (CRUD + snake/camel mapping)
- `hooks/useCategories.ts`, `hooks/useExpenses.ts`, `hooks/useMonthFilter.ts`
- Tests for hooks

### Step 5: Layout + Routing
- `AppLayout.tsx` with shadcn Tabs synced to React Router
- `App.tsx` with routes, QueryClientProvider, Toaster
- Placeholder pages

### Step 6: Categories Page (simpler, build first)
- CategoriesTable, CategoryRow, CategoryForm, CategoryFormDialog, CategoryDeleteDialog
- Assemble CategoriesPage
- Tests for CategoryForm

### Step 7: Expenses Page
- MonthPicker + test
- CategoryCombobox (with inline create) + test
- ExpenseForm + test, ExpenseFormDialog, ExpenseRow, ExpensesTable, ExpenseDeleteDialog
- Assemble ExpensesPage

### Step 8: Excel Export
- `exportToExcel.ts` helper + test
- ExportButton component wired into ExpensesPage

### Step 9: Polish + Deploy
- Loading skeletons, empty states, error toasts
- Responsive check (table horizontal scroll on mobile)
- `npm run lint` + `npm test` green
- Deploy to Vercel/Netlify with env vars

## Phase 2 Readiness (Charts)
- `categories.color` column already in schema
- Install `recharts`, aggregate expenses by category with `reduce`, render PieChart
- No schema or API changes needed

## Phase 3 Readiness (Auth)
- Add `user_id` column to both tables
- Replace open RLS policies with `auth.uid()` checks
- Add Supabase Auth provider + route guards
- API layer unchanged (Supabase auto-includes auth token)

## Verification Plan
1. Run `npm run lint` - zero errors
2. Run `npm test` - all tests pass
3. Manual test flow:
   - Create 3+ categories on Categories page
   - Add 5+ expenses across 2 months on Expenses page
   - Switch months with MonthPicker - verify filtering
   - Create a category inline from the expense form
   - Edit an expense, verify update
   - Delete an expense, verify removal
   - Try deleting a category with expenses - verify error message
   - Export to Excel - verify file downloads with correct data
4. Deploy to Vercel, verify env vars work and app loads
