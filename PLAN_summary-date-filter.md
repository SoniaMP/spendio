# Plan — Filtro por fechas en la página RESUMEN

Permitir filtrar el resumen por **rango de fechas (desde/hasta)** con **presets rápidos**, además de los filtros actuales por hojas y categorías.

> Estado: PROPUESTA — pendiente de aprobación. No implementar hasta confirmación explícita.
> (Candidato a groomearse como UC en `docs/business/features/01.expenses.md` si quieres trazabilidad formal.)

## Decisión de producto (confirmada)

- Tipo de filtro elegido: **Rango desde/hasta + presets rápidos**.
- Presets: **Este mes** · **Últimos 3 meses** · **Año actual** · **Personalizado**.
  - **Año actual** = 1 de enero – 31 de diciembre del año en curso (año natural).
- Preset por defecto: **Este mes** (mantiene el comportamiento actual: el resumen arranca mostrando el mes en curso, sin regresión).

## Cómo funciona hoy (contexto)

- `src/components/summary/SummaryPage.tsx:15` usa `useMonthFilter()` → `monthKey` (`YYYY-MM`) y lo pinta con `MonthPicker` (flechas mes anterior/siguiente).
- `useSummary(sheetIds, monthKey)` (`src/hooks/useSummary.ts`) → `fetchSummary` (`src/api/summary.ts`) → `GET /api/summary?sheetIds=..&month=YYYY-MM`.
- El backend (`server/routes/summary.ts:58`) filtra con `e.date LIKE ? || '%'` usando el `month`.
- Los filtros de hojas/categorías viven en `useSummaryConfig` (`src/hooks/useSummaryConfig.ts`) con persistencia en `localStorage` (`spendio-summary-config`) y se pintan en `SummaryConfig.tsx`.

**Decisión de diseño:** el rango de fechas **sustituye** a la navegación mes-a-mes (`MonthPicker`) en RESUMEN. El preset "Este mes" cubre el caso común y los presets dan saltos rápidos por periodo. (`MonthPicker` y `useMonthFilter` siguen en uso en la página de gastos `ExpensesPage`, así que NO se borran; solo dejan de usarse en RESUMEN.)

## Cambios

### 1. Backend — `server/routes/summary.ts`

- Aceptar `from` y `to` (`YYYY-MM-DD`) en vez de `month`.
- Validación: ambos obligatorios junto con `sheetIds`; si `from > to` → 400.
- Cambiar el `WHERE` de `e.date LIKE ? || '%'` a `e.date >= ? AND e.date <= ?` (rango inclusivo; `date` es `YYYY-MM-DD`, comparación lexicográfica = cronológica).
- Resto de la query y el shape de respuesta intactos.

### 2. Helpers de fecha — `src/helpers/dateHelpers.ts`

- Añadir `type DatePreset = 'this-month' | 'last-3-months' | 'this-year' | 'custom'`.
  - (`'this-year'` se etiqueta en la UI como "Año actual"; es el año natural 1 ene – 31 dic.)
- Añadir `getDateRangeForPreset(preset, today?): { from: string; to: string }` devolviendo fechas `YYYY-MM-DD`, usando `date-fns`:
  - `this-month` → `startOfMonth(today)` … `endOfMonth(today)`.
  - `last-3-months` → `startOfMonth(subMonths(today, 2))` … `endOfMonth(today)`.
  - `this-year` → `startOfYear(today)` … `endOfYear(today)` (= 1 ene – 31 dic).
  - `custom` no aplica (lo gestiona el hook con las fechas guardadas).
  - `today` inyectable por parámetro para tests deterministas.
- Añadir `formatDateRangeLabel(from, to)` para el texto resumido (ej. "1 mar – 18 jun 2026").

### 3. Estado del filtro — `src/hooks/useSummaryConfig.ts`

- Extender `SummaryConfig` con:
  ```ts
  datePreset: DatePreset;        // default 'this-month'
  customFrom: string | null;     // YYYY-MM-DD, solo cuando preset='custom'
  customTo: string | null;
  ```
- Persistir en el mismo `localStorage` que hojas/categorías.
- **Presets relativos se recalculan en cada carga** (no se persiste el rango calculado, solo el preset). Solo `custom` persiste fechas explícitas.
- Nuevas acciones: `setDatePreset(preset)`, `setCustomRange(from, to)`.
- Derivar el rango efectivo `{ from, to }`: si `preset === 'custom'` usar `customFrom/customTo`; si no, `getDateRangeForPreset(preset)`.
- Migración suave de configs antiguas en `localStorage`: si faltan los campos nuevos, rellenar con defaults (`datePreset: 'this-month'`).

### 4. Fetch — `src/hooks/useSummary.ts` y `src/api/summary.ts`

- `fetchSummary(sheetIds, from, to)` → query con `from` y `to`.
- `useSummary(sheetIds, from, to)` → `queryKey` incluye `from`/`to`.

### 5. UI — nuevo `src/components/summary/DateRangeFilter.tsx`

- Fila de botones de preset (Este mes / Últimos 3 meses / Año actual / Personalizado) — botón activo resaltado (`variant` según selección, patrón ya usado en `SummaryConfig` para "Todas").
- Cuando el preset es **Personalizado**: mostrar dos `<input type="date">` (desde/hasta). Inputs nativos para no añadir dependencias ni un componente calendario nuevo (alineado con "claridad sobre artificio"). *(Alternativa si prefieres: construir un date picker con el `Popover` de `ui/popover.tsx` + un `Calendar` de shadcn — supone añadir el componente Calendar; lo dejo fuera por defecto.)*
- Props: `preset`, `from`, `to`, `onPresetChange`, `onCustomRangeChange`. Componente de presentación puro (< 150 LOC, 1 responsabilidad).
- Mantener cada archivo ≤ 200 LOC; si `DateRangeFilter` crece, extraer la fila de presets a un subcomponente.

### 6. Integrar en `src/components/summary/SummaryPage.tsx`

- Quitar `useMonthFilter`/`MonthPicker` de esta página.
- Tomar `datePreset`, rango efectivo `{ from, to }` y las nuevas acciones de `useSummaryConfig`.
- Pasar `from`/`to` a `useSummary`.
- Renderizar `<DateRangeFilter ... />` en la cabecera (donde estaba el `MonthPicker`).

## Tests (gate de calidad)

- **Backend** — nuevo `server/__tests__/routes/summary.test.ts` (no existe hoy):
  - filtra por rango inclusivo (gastos dentro/fuera de `from`–`to`).
  - 400 si falta `from`/`to` o si `from > to`.
  - 403 si no hay acceso a alguna hoja (comportamiento ya existente).
- **Helpers** — `src/__tests__/helpers/dateHelpers.test.ts`:
  - `getDateRangeForPreset` para los 3 presets relativos con una fecha "hoy" fija (inyectada por parámetro para no depender del reloj).
  - "Año actual" devuelve 1 ene – 31 dic del año de `today`.
  - cruce de año en "Últimos 3 meses".
- **Hook** — ampliar `src/__tests__/hooks/useSummaryConfig.test.ts`:
  - default `this-month`; `setDatePreset`; `setCustomRange`; persistencia; migración de config antigua sin los campos nuevos.
- **Componente** — `src/__tests__/components/summary/DateRangeFilter.test.tsx`:
  - resalta el preset activo; al pulsar un preset llama `onPresetChange`; en "Personalizado" aparecen los inputs y cambiarlos llama `onCustomRangeChange`.
- Ejecutar `npm test` y `npm run lint` antes de cerrar.

## Fuera de alcance

- Cambiar el filtro de fechas de la página de gastos (`ExpensesPage`) — sigue con `MonthPicker`.
- Comparativa entre periodos / gráficas temporales.
- Añadir un componente Calendar de shadcn (solo si tras revisar el UX prefieres date picker en vez de inputs nativos).

## Definición de hecho

- RESUMEN filtra por rango desde/hasta con los 4 presets; "Este mes" por defecto.
- La selección persiste entre recargas (presets relativos recalculados, custom con fechas guardadas).
- `npm test` y `npm run lint` en verde.
- Filtros de hojas y categorías siguen funcionando combinados con el de fechas.
