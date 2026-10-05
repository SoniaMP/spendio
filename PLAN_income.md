# PLAN — INC Monthly income (`docs/business/features/05.income.md`)

Execution plan for UC-INC-01 … UC-INC-05. Decisions are already locked in the feature
file; this document only orders the work and names the files.

## Phases

### Phase 1: MVP — "veo cuánto me queda"

Goal: the chip shows income and remaining for the visible month, the user can add
lines and cancel mistakes. Shippable on its own.

Tasks:

1. **Table `income_lines` in `CREATE_TABLES`** (S)
   - Append the table + `idx_income_lines_user_month (user_id, start_month)` +
     `income_lines_updated_at` trigger to `server/schema.ts`.
   - **No entry in `runMigrations`**: `server/db.ts:16` runs `CREATE TABLE IF NOT EXISTS`
     on every boot, and `runMigrations` is only for `ALTER` on pre-existing tables.
   - No `scope` column, no `line_group_id` — deliberate, see feature Rules.
   - Dependencies: none.

2. **`IncomeChangeScope` + error codes** (S)
   - `shared/incomeChangeScope.ts` with the const-object + type pattern
     (`erasableSyntaxOnly` forbids native `enum`).
   - New `ErrorCode` members in `shared/errorCodes.ts`: invalid month format,
     non-positive amount, missing label, line not found / not owned, invalid scope.
   - Dependencies: none. Do it in parallel with task 1.

3. **Month-key helpers (server)** (S)
   - `server/helpers/monthKeys.ts`: `previousMonthKey`, `nextMonthKey`,
     `isValidMonthKey`, `currentMonthKey`. `'YYYY-MM'` compares correctly as a string,
     so no date parsing is needed beyond the ±1 arithmetic.
   - Client side already has `getMonthKey` in `src/helpers/dateHelpers.ts:26` and does
     not need the ±1 arithmetic — no shared module, no duplicated logic.
   - Dependencies: none.

4. **Resolver `resolveMonthlyIncome`** (S)
   - `server/helpers/resolveMonthlyIncome.ts`: branch-free `SUM` of the lines in force.
     ```sql
     SELECT COALESCE(SUM(amount), 0) FROM income_lines
     WHERE user_id = ? AND start_month <= ? AND (end_month IS NULL OR end_month >= ?)
     ```
   - Plus `listLinesForMonth(userId, monthKey)` with the same `WHERE`, for UC-INC-02.
   - Dependencies: 1.

5. **`GET /api/monthly-income`** (M)
   - `server/routes/monthlyIncome.ts`, mounted in `server/main.ts` **after**
     `app.use('/api', requireAuth)` (line 39) — auth comes for free.
   - Returns `{ amount, spent, remaining, lines[] }` in one call (global no-N+1 rule).
   - `spent` = `SUM(amount)` over `expenses` where `user_id = req.userId` and
     `date >= 'YYYY-MM-01' AND date <= 'YYYY-MM-31'`, **across all sheets**. Same
     range-compare style as `server/routes/summary.ts:60`. No `hasSheetAccess` call
     anywhere — income is not sheet-scoped.
   - Rejects a malformed `month` with 400.
   - Dependencies: 2, 3, 4.

6. **`POST` + `DELETE /api/income-lines`** (M)
   - `server/routes/incomeLines.ts`, mounted alongside task 5.
   - `POST`: label required, `amount > 0`, `start_month` = the month sent by the client,
     `end_month = NULL` (recurring) or `= start_month` (single month).
   - `DELETE`: cancel per UC-INC-05 — `end_month = M−1` for a recurring line (history
     preserved), hard delete for a single-month line.
   - `findOwn(id, userId)` guard on every route, mirroring
     `server/routes/recurringExpenses.ts:46`.
   - Dependencies: 5.

7. **Backend tests** (M)
   - `server/__tests__/helpers/resolveMonthlyIncome.test.ts`: several lines in force sum;
     closed lines ignored; no lines → 0; a single-month line **adds** to the recurring
     ones (no precedence).
   - `server/__tests__/routes/monthlyIncome.test.ts`: `spent` counts only
     `user_id = actor`, including expenses the actor logged on a sheet shared with them,
     and excludes other users' expenses on shared sheets; 400 on a bad month.
   - `server/__tests__/routes/incomeLines.test.ts`: create validation; cancel closes at
     `M−1` and past months still count the line; another user cannot touch the line.
   - Dependencies: 6.

8. **Frontier regression test** (S)
   - Assert expense aggregates, `GET /api/summary` and the Excel export payload are
     identical with and without income lines present. This is the guard that keeps the
     feature from drifting into income tracking; cheap now, impossible to retrofit once
     someone "just adds net totals".
   - Dependencies: 6.

9. **API client + query hook** (S)
   - `src/api/income.ts` (fetch/create/cancel) and `src/hooks/useMonthlyIncome.ts`,
     following the `src/api/recurring.ts` + `src/hooks/useRecurringExpenses.ts` shape.
   - Query key `['monthly-income', monthKey]`.
   - Dependencies: 5, 6.

10. **Invalidation wiring** (S) — *highest risk of being forgotten*
    - Extract `invalidateExpenseDependents(queryClient)` and call it from the four
      mutation sites in `src/hooks/useExpenses.ts` (lines 48, 64, 77, 89) plus the
      recurring hooks that already invalidate `['expenses']`.
    - Without this the remaining goes stale the moment an expense is added, which is
      exactly the number the whole feature exists to show.
    - Dependencies: 9.

11. **`MonthlyIncomeChip`** (M)
    - `src/components/income/MonthlyIncomeChip.tsx`, rendered in the `ExpensesPage`
      toolbar in the same row as `MonthPicker` (`src/components/expenses/ExpensesPage.tsx:181`).
    - `Ingresos 2.000 € · quedan 200 €`; remaining colored by sign; collapses to
      `+ Ingresos` with no line in force; renders nothing when the user has no lines at all.
    - Shown regardless of `isReadOnly` — income belongs to the actor, not the sheet.
    - Labels the scope of `spent` as "all sheets" so it does not read as contradicting
      `MonthTotal`, which stays scoped to the active sheet.
    - **Not** hung off `MonthlySummary`: that card only renders with
      `expenses.length > 0` (`ExpensesPage.tsx:196`), so a first-time user would see nothing.
    - Dependencies: 9, 10.

12. **`IncomeLinesDialog` + `IncomeLineForm`** (M)
    - `src/components/income/IncomeLinesDialog.tsx`: month-scoped list (label, amount,
      recurring/single-month badge) with cancel per row and `+ Nueva línea`; footer with
      total and remaining.
    - `src/components/income/IncomeLineForm.tsx`: label, amount, recurrence choice.
    - Edit is **not** in this phase (phase 2).
    - Keep each component under the 150-LOC limit; split a row component out if needed.
    - Dependencies: 11.

13. **i18n es + en** (S)
    - `src/i18n/locales/es.json` and `en.json`: chip, dialog title, form labels,
      validation, empty state, toasts. Spanish is primary.
    - Dependencies: 11, 12.

14. **Frontend tests** (M)
    - `src/__tests__/components/income/MonthlyIncomeChip.test.tsx`: positive / negative /
      no-line-in-force states.
    - `IncomeLineForm.test.tsx`: validation and the recurrence choice.
    - Dependencies: 12, 13.

### Phase 2: Line management (UC-INC-04)

Goal: a raise and an exceptional month are both expressible without lying about closed
months. This is the feature-complete point per the original brief ("editable/cancelable").

Tasks:

1. **`applyIncomeChange` helper** (L) — *the hard part of the whole feature*
   - `server/helpers/applyIncomeChange.ts`, one transaction, two branches:
     - `FromNowOn`: close the in-force row at `M−1`, insert a new one from `M` with
       `end_month = NULL`. **2 rows.**
     - `ThisMonth`: close at `M−1`, insert a single-month row at `M` with the new amount,
       **reopen** from `M+1` with the previous amount. **3 rows.**
   - Editing a line that is already single-month: plain in-place update, no branching.
   - Dependencies: Phase 1 complete.

2. **`PUT /api/income-lines/:id`** (M)
   - Body carries `scope`. Validates it against `IncomeChangeScope`.
   - Label-only change does **not** go through `applyIncomeChange`: it is an
     `UPDATE ... WHERE label = ? AND start_month >= ?` so the rename propagates forward
     and never rewrites the past. The scope question is never asked for a rename.
   - Dependencies: 2.1.

3. **`applyIncomeChange` unit tests** (M)
   - Table-driven: `FromNowOn` leaves `M−1` on the old amount and every month from `M`
     on the new one; `ThisMonth` produces exactly three rows and leaves both `M−1` and
     `M+1` on the old amount; editing a single-month line stays at one row.
   - Rename applies to the in-force row and future ones, never to past ones.
   - Dependencies: 2.1, 2.2.

4. **`IncomeChangeScopeDialog`** (M)
   - `src/components/income/IncomeChangeScopeDialog.tsx`: "¿Solo este mes, o a partir de
     ahora?". Shown only for amount changes. The user is never shown an interval.
   - Wire edit into `IncomeLinesDialog` rows; extend `src/api/income.ts` and the hook.
   - Dependencies: 2.2.

5. **i18n + component tests for the scope prompt** (S)
   - Dependencies: 2.4.

### Phase 3: Polish and open questions

Goal: close the UI decisions parked in the feature file.

Tasks:

1. **Remaining color thresholds** (S) — at what percentage does it turn amber, is red
   only for negative. Currently unspecified in the feature file.
2. **Future `start_month`** (S) — decide whether the form allows it. Intervals support it
   for free; purely a UI call.
3. **Empty-month affordance** (S) — lines in other months but none in the visible one:
   discreet `+ Ingresos` or nothing.
4. **Composite index `(user_id, date)` on `expenses`** (S) — the `spent` query currently
   relies on `idx_expenses_user_id` or `idx_expenses_date` separately. Irrelevant at
   personal-app volume; cheap insurance. Would need a `runMigrations` entry since
   `expenses` already exists in deployed databases.
5. **README feature list** (S) — add the feature once it actually ships, not before.

## Architecture Notes

**Modules**

| Layer | Files |
|---|---|
| Schema | `server/schema.ts` (append only, no migration) |
| Shared | `shared/incomeChangeScope.ts`, `shared/errorCodes.ts` |
| Server helpers | `monthKeys.ts`, `resolveMonthlyIncome.ts`, `applyIncomeChange.ts` (phase 2) |
| Server routes | `monthlyIncome.ts` (read), `incomeLines.ts` (write) — split to respect the one-export-per-file rule |
| Client | `src/api/income.ts`, `src/hooks/useMonthlyIncome.ts`, `src/components/income/*` |

**Data flow**

`ExpensesPage` owns the visible month (`useMonthFilter`, local `useState`) → passes
`monthKey` to `MonthlyIncomeChip` → `useMonthlyIncome(monthKey)` →
`GET /api/monthly-income?month=` → resolver `SUM` over `income_lines` + `SUM` over
`expenses` filtered by `user_id` → `{ amount, spent, remaining, lines[] }` in one
response. Any expense mutation invalidates `['monthly-income']`, so the remaining
re-reads on the next render.

**Technical decisions already settled** (do not relitigate during implementation)

- Income is a **reference figure, never a transaction**. No aggregate anywhere switches
  from gross to net.
- **Per user**, not per sheet. `spent` is `expenses.user_id = actor` across all sheets.
- **Validity intervals**, so editing never rewrites closed months.
- **Additive lines, no precedence.** A single-month line adds; it does not override.
- Line type is **derived, never stored** → no `scope` column.
- The panel is **month-scoped** → no `line_group_id`.
- `scope` is an **operation parameter**, not a column.
- **No activation setting.** Zero lines = feature invisible.

**Placement note.** The chip lives on `ExpensesPage`, not in the `AppLayout` header,
because the visible month is local `useState` inside `ExpensesPage`
(`src/hooks/useMonthFilter.ts:17`) and the header cannot read it. Moving the chip to the
header later requires lifting the month into the URL first — a refactor of
`useMonthFilter`, `ExpensesPage`, `MonthPicker` and `useCategoryComparison`.

## Risks & Bottlenecks

1. **Stale remaining (highest practical risk).** Four mutation sites in
   `src/hooks/useExpenses.ts` plus the recurring hooks must invalidate
   `['monthly-income']`. Miss one and the headline number silently lies. Mitigation:
   the shared `invalidateExpenseDependents` helper in Phase 1 task 10 rather than five
   copy-pasted calls.
2. **`ThisMonth` three-row split (highest logic risk).** The only genuinely tricky code
   in the feature, and off-by-one errors on `M−1`/`M+1` are invisible until someone
   browses an old month. Mitigation: table-driven tests written alongside the helper,
   not after.
3. **Frontier erosion.** The feature is only safe because income never enters an
   aggregate. The regression test in Phase 1 task 8 is what keeps a future "show me the
   net total in the summary" from quietly turning Spendio into a finance manager.
4. **Month-string arithmetic.** `'YYYY-MM'` string comparison is correct and index-friendly,
   but December→January must be covered by tests in `monthKeys.ts`.
5. **Scope confusion in the UI.** The chip is per-user inside a per-sheet view, sitting
   next to a per-sheet `MonthTotal`. If the "all sheets" label is dropped during
   implementation, users will read the two numbers as contradictory.

**No external blockers.** No new dependency, no migration, no cron, no email, no change
to any existing endpoint. Phase 1 tasks 1–3 can start in parallel.

## Next Actions

1. Phase 1 task 1 — `income_lines` in `server/schema.ts` (+ index + trigger).
2. Phase 1 task 2 — `shared/incomeChangeScope.ts` and the new `ErrorCode` members.
3. Phase 1 task 4 — `resolveMonthlyIncome` with its unit test, which locks the
   additive-no-precedence rule in code before any UI exists.
