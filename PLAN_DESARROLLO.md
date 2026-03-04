# Personal Finances App - Implementation Plan

## Context

Build a simple personal finance app to replace an Excel spreadsheet. The app tracks monthly expenses by category, allows CRUD on both expenses and categories, and exports to Excel. Architecture should support future additions: charts (Phase 2) and auth (Phase 3).

## Tech Stack

- **Frontend**: Vite + React + TypeScript
- **Backend**: Express + better-sqlite3 (local server, no external DB)
- **UI**: shadcn/ui + Tailwind CSS
- **Currency**: EUR (€), locale `es-ES`
- **Dev**: `concurrently` runs Vite + Express in a single `npm run dev`

## Database Schema (SQLite)

IDs are `INTEGER PRIMARY KEY AUTOINCREMENT` (not UUID). Frontend types use `number`.

### `categories` table
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| name | TEXT UNIQUE NOT NULL | |
| color | TEXT NOT NULL | default `#6B7280`, for Phase 2 charts |
| created_at | TEXT | default `datetime('now')` |
| updated_at | TEXT | auto-trigger |

### `expenses` table
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| amount | REAL NOT NULL | `CHECK (amount > 0)` |
| description | TEXT NOT NULL | default `''` |
| date | TEXT NOT NULL | default `date('now')` |
| category_id | INTEGER FK NOT NULL | references `categories(id) ON DELETE RESTRICT` |
| created_at | TEXT | default `datetime('now')` |
| updated_at | TEXT | auto-trigger |

- WAL mode enabled for better concurrency
- Indexes on `expenses.date` and `expenses.category_id`
- Seed categories: Alimentación, Transporte, Vivienda, Suministros, Ocio, Salud, Educación, Otros
- DB file stored in `data/finances.db` (gitignored)

## Project Structure

```
server/
  main.ts                # Express app, listens on PORT 3001
  db.ts                  # better-sqlite3 singleton + schema init
  schema.ts              # CREATE TABLE + triggers + seed SQL
  types.ts               # DB row types + request body types
  routes/
    categories.ts        # GET/POST/PUT/DELETE /api/categories
    expenses.ts          # GET/POST/PUT/DELETE /api/expenses
  middleware/
    errorHandler.ts      # Central error handler (constraint errors → 409)

src/
  lib/
    queryClient.ts           # TanStack Query config
    utils.ts                 # cn() helper (shadcn)
  types/
    category.ts              # Category (number id)
    expense.ts               # Expense, ExpenseWithCategory (number id)
  api/
    categories.ts            # fetch/create/update/delete via /api
    expenses.ts              # fetch/create/update/delete via /api
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

## API Endpoints

### Categories (`/api/categories`)
| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/categories` | — | `Category[]` |
| POST | `/api/categories` | `{ name, color? }` | `Category` (201) |
| PUT | `/api/categories/:id` | `{ name?, color? }` | `Category` |
| DELETE | `/api/categories/:id` | — | `{ success: true }` or 409 if has expenses |

### Expenses (`/api/expenses`)
| Method | Path | Body / Query | Response |
|--------|------|-------------|----------|
| GET | `/api/expenses?month=YYYY-MM` | query: month | `ExpenseWithCategory[]` |
| POST | `/api/expenses` | `{ amount, description?, date, categoryId }` | `Expense` (201) |
| PUT | `/api/expenses/:id` | partial fields | `Expense` |
| DELETE | `/api/expenses/:id` | — | `{ success: true }` |

## Key Dependencies

| Package | Purpose |
|---|---|
| `express` + `better-sqlite3` | Local API server + SQLite database |
| `cors` | Cross-origin requests (dev) |
| `react-router-dom` | 2 routes: `/expenses`, `/categories` |
| `@tanstack/react-query` | Server state, caching, mutations |
| `date-fns` | Month filtering, date formatting |
| `xlsx` | Excel export |
| `sonner` | Toast notifications (shadcn integration) |
| `concurrently` + `tsx` | Dev: run Vite + Express together |
| `vitest` + `@testing-library/react` | Testing |

## Key Design Decisions

- **State management**: TanStack Query only (no Redux/Zustand). All state is server state.
- **Form handling**: Controlled inputs, no form library (only 4-5 fields per form).
- **API layer**: Frontend `api/` files call `/api/*` endpoints via `fetch`. Vite proxies to Express in dev.
- **Inline category creation**: `CategoryCombobox` uses shadcn's Popover+Command. When user types a name that doesn't exist, a "Create [name]" option appears.
- **Delete protection**: `ON DELETE RESTRICT` prevents deleting categories with expenses. UI shows a warning.

## Implementation Steps

### Step 1: Project Scaffolding ✅
- Vite + React + TypeScript template
- Tailwind CSS v4, shadcn/ui, TypeScript path aliases (`@/*`)
- Vitest + testing-library
- Git init

### Step 2: Backend Setup ✅
- Express + better-sqlite3 server in `server/`
- SQLite schema with tables, triggers, indexes, seed data
- REST API routes for categories and expenses
- Vite proxy `/api` → `http://localhost:3001`
- `npm run dev` starts both client and server via concurrently

### Step 3: Foundation Layer
- `lib/queryClient.ts`
- Type definitions in `types/` ✅ (already created)
- Helper functions in `helpers/` + tests for each

### Step 4: API + Hooks Layer
- `api/categories.ts` and `api/expenses.ts` (fetch-based CRUD)
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

### Step 9: Polish
- Loading skeletons, empty states, error toasts
- Responsive check (table horizontal scroll on mobile)
- `npm run lint` + `npm test` green

## Phase 2 Readiness (Charts)
- `categories.color` column already in schema
- Install `recharts`, aggregate expenses by category with `reduce`, render PieChart
- No schema or API changes needed

## Phase 3 Readiness (Auth)
- Add `user_id` column to both tables
- Add auth middleware to Express (JWT or session-based)
- Route guards on frontend
- API layer uses same endpoints, just with auth headers

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
