# Plan — UC-EXP-16: Recurring expense templates with email alerts

Reference: [`docs/business/features/01.expenses.md`](docs/business/features/01.expenses.md) → UC-EXP-16.

Suggested branch: `feature/exp-recurring`.

## Locked business decisions (2026-05-29)

1. **`start_date` en el pasado**: NO se permite. Validar `start_date >= today` en backend y frontend.
2. **Editar plantilla viva**: cambios de `start_date`/`period`/etc. → la **próxima** generación sale a partir del **nuevo `start_date`**. Reset implícito: al editar campos que afectan al calendario, reiniciamos `last_generated_period_index = -1` y `last_notified_period_index = -1`. Las instancias ya generadas siguen intactas.
3. **Mover un gasto generado** (UC-EXP-14): mueve solo el gasto, no afecta a la plantilla ni a futuras generaciones. Sin cambios — ya está cubierto.
4. **Pérdida de acceso → email de aviso**: cuando el cron auto-desactiva la plantilla por pérdida de `edit` en la hoja, mandamos email al creador ("tu recurrente X se ha desactivado porque has perdido acceso a la hoja"). Nuevo template de email.
5. **Aviso vs cobro desacoplados** (cambio respecto al UC original): el email sale `notice_days` antes; el gasto se inserta el día exacto del cobro. Implica:
   - Nueva columna `last_notified_period_index INTEGER NOT NULL DEFAULT -1`.
   - En cada corrida del cron, dos chequeos independientes por plantilla: ¿toca notificar? ¿toca insertar?
   - `notice_days = 0` → email y gasto el mismo día (caso degenerado válido).
6. **`notice_days` permitido**: 0 sí. Sin tope superior (el CHECK solo exige `>= 0`).
7. **Borrar categoría usada por plantilla**: cambiar FK a `ON DELETE SET NULL`. La plantilla queda con `category_id = NULL`; el cron salta esas plantillas (no genera) hasta que el user le asigne categoría. Indicador visual en el modal.
8. **Servidor caído**: idempotencia ya cubierta por los índices. El gasto se inserta con la fecha **correcta del periodo**, no `today`. El email tardío se envía igual (mejor tarde que nunca).
9. **Histórico en el modal**: no. Mostramos solo próximo cobro por plantilla.
10. **Empty state del modal**: título "Aún no tienes recurrentes", subtítulo "Crea uno para automatizar gastos que se repiten (alquiler, suscripciones, etc.)", CTA "+ Nueva".
11. **`category_id = NULL` y el cron**: silencio total. El cron salta la plantilla, sin email. El user la verá pausada en el modal (con indicador visual) cuando entre.
12. **Email tardío** (cron arranca con retraso): mismo copy siempre, `"Recordatorio: X - Y€ el {fecha}"`. La fecha del email = fecha del periodo (no `today`).
13. **Idioma de emails**: todo en español. No hay locale-detect en v1.
14. **Cron en dev**: NO arranca automático en `npm run dev`. Solo en `NODE_ENV=production`. En dev se dispara manualmente con `npm run cron:recurring`.

## Findings from the codebase

- **Email infra exists**: Resend (`server/services/email.ts` + templates in `server/templates/`). Reusable as-is.
- **No cron infrastructure**: nothing schedules background jobs today. Will add `node-cron` (small, in-process, fits the single-process express deploy).
- **Schema**: single SQL string in `server/schema.ts` — append the new table + index + trigger.
- **Sheet permission helper**: `server/helpers/sheetAccess.ts` already exists; reuse for `edit` checks.
- **Frontend**: `src/components/expenses/` is dense already; create a new `src/components/recurring/` directory as suggested in the UC.

## Phasing

The work splits cleanly into 4 phases. Each phase ends with green tests + lint.

### Phase 1 — Schema + types

- Append to `CREATE_TABLES` in `server/schema.ts`:
  - `recurring_expenses` table with all columns from the UC.
  - `idx_recurring_expenses_active` index on `(is_active, user_id)`.
  - `recurring_expenses_updated_at` trigger.
- Add `RecurringExpense` and `Period` types to `server/types.ts`.
- Smoke-test: server boots, migrations apply.

**No behavior yet — pure foundation.**

### Phase 2 — Backend CRUD

- New file `server/routes/recurringExpenses.ts` with:
  - `GET /api/recurring-expenses?sheetId=...` — list actor's own templates on sheet.
  - `POST /api/recurring-expenses` — create. Validates `edit` on `sheet_id` via `sheetAccess` helper; `amount > 0`; `period IN ('monthly','yearly')`; `notice_days >= 0`.
  - `PUT /api/recurring-expenses/:id` — edit. Only creator. Affects only future generations (no propagation logic needed — instances are independent).
  - `PATCH /api/recurring-expenses/:id/active` — toggle.
  - `DELETE /api/recurring-expenses/:id` — delete (no cascade to generated instances).
- Wire router in `server/main.ts`.
- Tests in `server/__tests__/routes/recurringExpenses.test.ts` covering: ownership checks, validation errors, happy paths.

### Phase 3 — Generator job + email

- Add dependency: `node-cron`.
- New file `server/services/recurringScheduler.ts`:
  - Pure function `computeNextDueDate(template, now)` using `clampDayToMonth` (already in `src/helpers/`; if server-side reuse needed, lift to a shared helper or duplicate — decide during impl).
  - Function `runRecurringGeneration()` that:
    - Loads active templates.
    - For each: re-validates `edit` access; if missing → `is_active = false` and skip.
    - If `next_due_at - notice_days ≤ today` AND `last_generated_period_index` < target index: in one transaction, insert expense + advance index. Then enqueue email send.
- Cron registration in `server/main.ts`: `cron.schedule('0 6 * * *', runRecurringGeneration)` (06:00 UTC daily). Skip in test env.
- New email template `server/templates/recurringExpenseAlert.ts` (subject + html + text in Spanish, link to sheet).
- Tests:
  - Unit: `computeNextDueDate` for monthly + yearly + Jan 31 → Feb clamp + leap year.
  - Unit: `runRecurringGeneration` happy path — inserts expense, advances index, calls email mock.
  - Unit: idempotency — running twice on the same day does not double-generate.
  - Unit: skips after user deletes a generated instance (no rollback of index).
  - Unit: auto-deactivates templates whose creator lost sheet access.
- Dev script: `npm run cron:recurring` to trigger `runRecurringGeneration()` once for manual QA.

### Phase 4 — Frontend

- New `src/api/recurring.ts`: typed fetchers for all 5 endpoints.
- New `src/components/recurring/`:
  - `RecurringExpensesModal.tsx` — list + "+ Nueva" button.
  - `RecurringExpenseForm.tsx` — form fields (amount, description, category, sheet, period, start_date, notice_days). Default `notice_days = 3`. Label: "Avisarme con X días de antelación".
  - `RecurringExpenseRow.tsx` — row with toggle, edit, delete.
- "Recurrentes" button on `ExpensesPage.tsx` header (alongside "Nueva", "Exportar"…).
- React Query hooks in `src/hooks/` for list + mutations, with cache invalidation.
- i18n (es): button label, modal title, form labels, validation copy, empty state, toasts.
- Component tests for the form (validation) and the modal (renders list, opens form).

### Phase 5 — Manual smoke test (you, not me)

1. Start dev server.
2. Create a template with `start_date = today + 4 days`, `notice_days = 3`.
3. Run `npm run cron:recurring`.
4. Expect: expense row appears for `start_date`, email arrives.
5. Re-run `cron:recurring`. Expect: nothing new (idempotent).
6. Delete the generated expense, re-run cron. Expect: nothing regenerated.

## Out of scope (per the UC's "Future extensions")

- Custom periodicity (`every N months`).
- Unified sheet settings drawer.
- Sync auto-deactivation hook on sheet access revoke (lives in [`docs/business/features/02.sheets.md`](docs/business/features/02.sheets.md) backlog "Revoke shared sheet access").
- In-app or push notifications.

## Open implementation decisions (resolve during coding, not blockers for the plan)

- `clampDayToMonth` location: keep in `src/helpers/` and duplicate on server, OR lift to a shared `shared/helpers/` directory. Pick whichever matches existing repo conventions for shared client/server code.
- Where exactly to place the "Recurrentes" button on the sheet header (alongside which existing button) — UI detail, decide while implementing `ExpensesPage.tsx`.
- Whether to rate-limit the cron trigger endpoint (`cron:recurring` script) or guard with an env flag in production.

## Definition of done

- All 4 phases merged.
- All `Tareas técnicas` from UC-EXP-16 ticked off in the PR description.
- Manual smoke test passes.
- After merge: flip UC-EXP-16 from `· PENDING` to `· DONE` in `01.expenses.md`, drop the `**Tareas técnicas**` block.
