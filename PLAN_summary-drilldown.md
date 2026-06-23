# Plan — Drill-down de detalle al pinchar una tarjeta del resumen

## Objetivo

En la página **Resumen**, al pinchar una tarjeta de hoja (`SheetSummaryCard`) navegar a
una **página dedicada** con la **lista de gastos reales** de esa hoja dentro del rango de
fechas seleccionado. Además, pinchar en una fila de categoría dentro de la tarjeta lleva
a la misma página pero filtrada por esa categoría.

La tabla es **solo lectura** (sin editar/borrar/mover): el resumen es una vista de
consulta multi-hoja; las ediciones siguen viviendo en la página de Gastos.

## Decisiones de diseño (confirmadas)

- **Página dedicada**, no Dialog: mejor en móvil (ancho completo, sin scroll anidado,
  atrás nativo) y URL compartible. Ruta nueva bajo `AppLayout`.
- **Solo lectura**: confirmado.
- **Click en categoría** además del click en la tarjeta: confirmado.
- **Reutilizar `ExpensesTable`** sin pasar handlers de acción → ya renderiza filas en
  modo `isReadOnly` (sin columna de acciones). No hay que tocar permisos.
- **Filtrar gastos por rango de fechas** (`from`/`to`), no por mes. Hoy el endpoint de
  gastos solo soporta `month`; hay que añadir soporte de rango, igual que ya hace
  `/api/summary`.
- **Filtro opcional por categoría** en el mismo endpoint, para el drill-down por fila.
- El rango (`from`/`to`) y la categoría viajan en la **URL** como query params.

## Cambios

### 1. Backend — `server/routes/expenses.ts`
- En `GET /`, además de `month`, leer `from`, `to` y `categoryId` de la query.
- Añadir a la SQL:
  - `from` → `AND e.date >= ?`
  - `to`   → `AND e.date <= ?`
  - `categoryId` → `AND e.category_id = ?`
- `month` se mantiene tal cual (compatibilidad con la página de Gastos).
- Tests en `server/__tests__/routes/expenses.test.ts`: filtro por rango, por rango +
  categoría, y que `month` sigue funcionando.

### 2. API cliente — `src/api/expenses.ts`
- Nueva función `fetchExpensesByRange(sheetId, from, to, categoryId?)` que construye los
  query params y devuelve `ExpenseWithCategory[]`. (Se deja `fetchExpenses` intacta.)

### 3. Hook — `src/hooks/useExpenses.ts`
- Nuevo hook `useExpensesByRange(sheetId, from, to, categoryId?)` con `queryKey` propia
  (`['expenses', sheetId, from, to, categoryId]`).

### 4. Nueva página — `src/components/summary/SheetDetailPage.tsx`
- Lee `sheetId` de la ruta (`useParams`) y `from`/`to`/`categoryId` de la query
  (`useSearchParams`).
- Usa `useExpensesByRange` + `ExpensesTable` (sin handlers → solo lectura).
- Cabecera: nombre de hoja + botón "Volver" (al resumen). Si hay categoría, mostrarla y
  el rango en el subtítulo.
- Estados: cargando / vacío ("No hay gastos en este periodo").
- < 150 LOC, una responsabilidad. (Para el nombre de la hoja se usa `useSheets`; el de
  categoría se deriva de los propios gastos o de la query.)

### 5. Ruta — `src/App.tsx`
- Añadir bajo `AppLayout`: `<Route path="summary/sheet/:sheetId" element={<SheetDetailPage />} />`.

### 6. `src/components/summary/SheetSummaryCard.tsx`
- Nuevas props opcionales `onSelect()` y `onSelectCategory(categoryId)`.
- La tarjeta entera es clicable (`role="button"`, cursor, hover) → `onSelect`.
- Cada fila de categoría → `onSelectCategory(cat.categoryId)` con `stopPropagation`.
- Sin handlers se comporta como hoy (no rompe tests existentes).

### 7. `src/components/summary/SummaryPage.tsx`
- `useNavigate`. Construir la URL destino con el rango actual (`dateRange.from`/`.to`) y,
  si aplica, `categoryId`.
- Pasar `onSelect`/`onSelectCategory` a cada `SheetSummaryCard`.

## Tests
- `expenses.test.ts` (backend): filtros por rango y por rango + categoría; `month` sigue
  funcionando.
- `SheetDetailPage.test.tsx`: render de gastos, estado vacío, lectura de params de URL.
- `SheetSummaryCard.test.tsx`: añadir caso de click dispara `onSelect` /
  `onSelectCategory`.
- `npm test` y `npm run lint` antes de cerrar.

## Fuera de alcance
- Editar/borrar/duplicar desde la página de detalle (se queda en la página de Gastos).
- Cambiar el diseño de las tarjetas o del gráfico de tarta.
- Desglose temporal por mes (era la opción B, descartada).
