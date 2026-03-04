# Plan: App Android para Finanzas Personales

## Contexto

La app web actual (React + Express + SQLite) funciona en localhost como herramienta personal. Se quiere crear una app Android nativa que consuma la **misma API backend** y ofrezca las mismas funcionalidades. Esto implica dos cambios: (1) preparar el backend para ser accesible desde la red, y (2) construir el cliente Android.

El proyecto Android vivirá en `android/` dentro del mismo monorepo.

---

## Decisiones Arquitectónicas

| Decisión | Elección | Justificación |
|---|---|---|
| **Tecnología** | Kotlin + Jetpack Compose | Toolkit recomendado por Google en 2026. UI declarativa, Material3 nativo, mejor integración con Android. |
| **Data source** | Shared backend (Express API) | Single source of truth. Ambas apps ven los mismos datos. |
| **Cache local** | No (fase 1). Room offline-cache opcional en fase 2 | Simplifica el MVP. Para una app personal en la misma red WiFi, la latencia es despreciable. |
| **Auth** | API key simple via header `X-API-Key` | Suficiente para una app personal. Sin OAuth/JWT overhead. Se añade al Express server como middleware. |
| **Deployment del backend** | Red local (misma WiFi) o túnel (Tailscale/ngrok) | No se necesita hosting cloud para uso personal. El servidor ya corre; solo hay que exponerlo en la LAN. |

---

## Parte 1: Preparar el Backend

### 1.1 Añadir auth por API key al Express server

**Archivo:** `server/middleware/apiKeyAuth.ts` (nuevo)

```ts
import type { RequestHandler } from 'express';

export function apiKeyAuth(): RequestHandler {
  const apiKey = process.env.API_KEY;

  return (req, res, next) => {
    // Si no hay API_KEY configurada, permitir todo (backward-compatible)
    if (!apiKey) return next();

    const provided = req.header('X-API-Key');
    if (provided === apiKey) return next();

    res.status(401).json({ error: 'Invalid or missing API key' });
  };
}
```

**Archivo:** `server/main.ts` (modificar)
- Importar y usar `apiKeyAuth` antes de las rutas
- Leer `API_KEY` de `process.env` o `.env`

**Archivo:** `.env` (nuevo o existente)
- `API_KEY=<algún UUID generado>`

### 1.2 Hacer el server accesible en LAN

**Archivo:** `server/main.ts` (modificar)
- Cambiar `app.listen(PORT)` → `app.listen(PORT, '0.0.0.0')` para aceptar conexiones externas
- La web sigue funcionando igual (Vite proxy no cambia)

### 1.3 Endpoint de health check

**Archivo:** `server/main.ts` (modificar)
- Añadir `GET /api/health` → `{ status: 'ok' }` para que la app Android pueda verificar conectividad

---

## Parte 2: Proyecto Android

### 2.1 Estructura del proyecto

```
android/
  app/
    src/main/java/com/finanzas/
      data/
        api/
          ApiClient.kt            # Retrofit instance + interceptor para API key
          ExpenseApi.kt           # Interface Retrofit para /api/expenses
          CategoryApi.kt          # Interface Retrofit para /api/categories
        dto/
          ExpenseDto.kt           # Data classes que mapean el JSON del server
          CategoryDto.kt
        repository/
          ExpenseRepository.kt    # Convierte DTOs → domain models
          CategoryRepository.kt
      domain/
        model/
          Expense.kt              # Domain model (= ExpenseWithCategory del web)
          Category.kt
          CategoryBreakdown.kt
          MonthComparison.kt
        usecase/
          CalcMonthTotal.kt       # Porta calcMonthTotal.ts
          CalcMonthComparison.kt  # Porta calcMonthComparison.ts
          GroupByCategory.kt      # Porta groupExpensesByCategory.ts
      ui/
        expenses/
          ExpensesScreen.kt       # Pantalla principal
          ExpensesViewModel.kt    # Estado + lógica de UI
          components/
            MonthPicker.kt
            SummaryCard.kt
            ExpenseList.kt
            ExpenseChart.kt
            CategoryFilterChips.kt
        categories/
          CategoriesScreen.kt
          CategoriesViewModel.kt
        shared/
          ExpenseFormDialog.kt
          CategoryFormDialog.kt
          DeleteConfirmDialog.kt
          ColorPicker.kt
          EmptyState.kt
        theme/
          Theme.kt                # Material3 dark/light
          Color.kt
          Type.kt
      navigation/
        AppNavigation.kt          # NavHost con BottomNavBar
        Screen.kt                 # Sealed class con rutas
      util/
        CurrencyFormatter.kt     # EUR es-ES
        DateFormatter.kt         # Fechas en español
        ExcelExporter.kt         # Apache POI → share intent
      di/
        AppModule.kt             # Hilt: Retrofit, repos, use cases
    src/test/                    # Unit tests (JVM)
    src/androidTest/             # Instrumented tests
  build.gradle.kts
  settings.gradle.kts
```

### 2.2 Tech Stack

| Librería | Uso |
|---|---|
| **Retrofit 2 + Moshi** | HTTP client para la REST API. Moshi para JSON parsing. |
| **Jetpack Compose BOM 2025.x** | UI toolkit |
| **Material3** | Design system, theming, componentes |
| **Navigation Compose 2.8.x** | Navegación entre pantallas |
| **Hilt 2.52.x** | Dependency injection |
| **Coroutines + Flow** | Async + reactive state |
| **ViewModel + StateFlow** | State management en UI |
| **Vico 2.x** | Charts (pie + bar) nativos para Compose |
| **Apache POI 5.x** | Generación de .xlsx |
| **DataStore Preferences** | Guardar API URL, API key, tema |
| **java.time** | Fechas (minSdk 26) |

### 2.3 Capa de datos (Retrofit)

**`ExpenseApi.kt`** — Mapea los endpoints existentes 1:1:

```kotlin
interface ExpenseApi {
    @GET("api/expenses")
    suspend fun getExpenses(@Query("month") month: String?): List<ExpenseDto>

    @POST("api/expenses")
    suspend fun createExpense(@Body body: CreateExpenseBody): ExpenseDto

    @PUT("api/expenses/{id}")
    suspend fun updateExpense(@Path("id") id: Int, @Body body: UpdateExpenseBody): ExpenseDto

    @DELETE("api/expenses/{id}")
    suspend fun deleteExpense(@Path("id") id: Int): SuccessDto
}
```

**`CategoryApi.kt`**:

```kotlin
interface CategoryApi {
    @GET("api/categories")
    suspend fun getCategories(): List<CategoryDto>

    @POST("api/categories")
    suspend fun createCategory(@Body body: CreateCategoryBody): CategoryDto

    @PUT("api/categories/{id}")
    suspend fun updateCategory(@Path("id") id: Int, @Body body: UpdateCategoryBody): CategoryDto

    @DELETE("api/categories/{id}")
    suspend fun deleteCategory(@Path("id") id: Int): SuccessDto
}
```

**`ApiClient.kt`**:
- Base URL configurable (guardada en DataStore, pantalla de Settings)
- Interceptor que añade `X-API-Key` header a cada request
- Timeout de 10s

### 2.4 Capa de dominio (Use Cases)

Portan directamente la lógica de `src/helpers/`:

| Web (TypeScript) | Android (Kotlin) |
|---|---|
| `calcMonthTotal.ts` | `CalcMonthTotal.kt` — `fun invoke(expenses): Double` |
| `calcMonthComparison.ts` | `CalcMonthComparison.kt` — `fun invoke(current, previous): MonthComparison` |
| `groupExpensesByCategory.ts` | `GroupByCategory.kt` — `fun invoke(expenses): List<CategoryBreakdown>` |
| `formatCurrency.ts` | `CurrencyFormatter.kt` — `NumberFormat.getCurrencyInstance(Locale("es","ES"))` |
| `formatDate.ts` | `DateFormatter.kt` — `DateTimeFormatter` con locale español |
| `exportToExcel.ts` | `ExcelExporter.kt` — Apache POI + FileProvider + share intent |

### 2.5 Capa de UI

**Navegación:** `BottomNavigationBar` con 3 destinos: Gastos, Categorías, Settings.

**`ExpensesScreen`** (equivalente a `ExpensesPage.tsx`):
- `MonthPicker` arriba (flechas + label del mes en español)
- `CategoryFilterChips` — `LazyRow` de chips filtrables (reemplaza el dropdown Select del web)
- `SummaryCard` — Total del mes, badge de comparación (% vs mes anterior), top 3 categorías
- `ExpenseChart` — Tabs con pie/bar chart (Vico)
- `ExpenseList` — `LazyColumn` con swipe-to-delete
- FAB para añadir gasto

**`CategoriesScreen`** (equivalente a `CategoriesPage.tsx`):
- Lista de categorías con color dot + nombre
- FAB para añadir categoría
- Tap para editar, swipe para eliminar

**Dialogs:**
- `ExpenseFormDialog` — Amount (teclado decimal), description, date picker nativo, category dropdown
- `CategoryFormDialog` — Nombre + color picker (grid de colores preset)
- `DeleteConfirmDialog` — Confirmación con mensaje

**Tema:** Material3 con `dynamicColorScheme` (Android 12+) + fallback. Toggle dark/light/system guardado en DataStore.

### 2.6 ViewModel Pattern

```kotlin
// ExpensesViewModel.kt (simplificado)
class ExpensesViewModel @Inject constructor(
    private val repo: ExpenseRepository,
    private val categoryRepo: CategoryRepository,
) : ViewModel() {

    // Estado del mes actual
    private val _currentMonth = MutableStateFlow(YearMonth.now())

    // UI State reactivo
    val uiState: StateFlow<ExpensesUiState> = _currentMonth
        .flatMapLatest { month ->
            // Fetch expenses del mes actual y anterior en paralelo
            combine(
                repo.getExpenses(month),
                repo.getExpenses(month.minusMonths(1)),
                categoryRepo.getCategories()
            ) { current, previous, categories ->
                // Calcular totales, comparación, breakdown
                ExpensesUiState.Success(...)
            }
        }
        .catch { emit(ExpensesUiState.Error(it.message)) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), ExpensesUiState.Loading)

    fun goToPreviousMonth() { _currentMonth.update { it.minusMonths(1) } }
    fun goToNextMonth() { _currentMonth.update { it.plusMonths(1) } }
    fun setFilter(categoryId: Int?) { /* update filter state */ }
}
```

**Nota:** A diferencia de TanStack Query (que cachea y revalida automáticamente), aquí cada cambio de mes hace un nuevo request al server. Para el MVP esto es suficiente. Si se quiere cache, se puede añadir Room como cache layer en una fase posterior.

---

## Parte 3: Testing

### Unit Tests (JVM, sin Android)
- `CalcMonthTotalTest` — suma, lista vacía
- `CalcMonthComparisonTest` — todos los edge cases (ambos cero, previo cero, subida, bajada, igual)
- `GroupByCategoryTest` — agrupación, orden por monto desc, porcentajes
- `CurrencyFormatterTest` — formato "3,50 €"
- `DateFormatterTest` — formato español

### Instrumented Tests (Android)
- `ExpenseApiTest` — MockWebServer + Retrofit, verifica parsing de JSON
- `ExpensesScreenTest` — Compose UI test: loading → list, FAB abre dialog, filtro funciona

---

## Parte 4: Pantalla de Settings

Una pantalla simple con:
- **Server URL** — TextField para `http://192.168.1.X:3001` (guardado en DataStore)
- **API Key** — TextField con máscara (guardado en DataStore)
- **Tema** — Toggle dark/light/system
- **Botón "Probar conexión"** — Llama a `GET /api/health` y muestra resultado

Esto permite configurar la app sin hardcodear la IP del servidor.

---

## Orden de Implementación

1. **Backend: API key middleware + bind 0.0.0.0 + health endpoint**
2. **Android: Project scaffold** — Gradle, Hilt, Retrofit, tema base
3. **Android: Data layer** — DTOs, APIs Retrofit, repositories
4. **Android: Settings screen** — Configurar URL + API key
5. **Android: Expenses screen básica** — MonthPicker + lista de gastos
6. **Android: CRUD dialogs** — Crear/editar/eliminar gastos
7. **Android: Summary + comparación** — Total, badge, top categorías
8. **Android: Charts** — Vico pie + bar chart
9. **Android: Category filter** — Chips de filtro
10. **Android: Categories screen** — CRUD completo con color picker
11. **Android: Export Excel** — Apache POI + share intent
12. **Android: Tests** — Unit + instrumented

---

## Verificación

1. Iniciar el server web: `npm run dev`
2. Encontrar IP local: `ifconfig | grep inet`
3. En Android (emulador o device en misma WiFi):
   - Settings → ingresar URL `http://<IP>:3001` y API key
   - Probar conexión → "OK"
   - Navegar meses, ver gastos, crear/editar/eliminar
   - Verificar que los cambios se reflejan en la web (y viceversa)
4. Probar export Excel → compartir archivo
5. Probar tema dark/light
6. Correr `./gradlew test` (unit tests)
7. Correr `./gradlew connectedAndroidTest` (instrumented tests)

---

## Archivos del monorepo a modificar/crear

| Archivo | Cambio |
|---|---|
| `server/main.ts` | Bind a `0.0.0.0`, añadir `apiKeyAuth` middleware, endpoint `/api/health` |
| `server/middleware/apiKeyAuth.ts` | Nuevo: middleware de API key |
| `.env` | Nuevo o actualizar: añadir `API_KEY` |
| `.gitignore` | Añadir `.env` si no está ya |
| `android/` | Todo el proyecto Android nuevo |

---

## Referencias: Archivos web clave a portar

| Archivo web | Qué portar |
|---|---|
| `server/schema.ts` | Schema SQL y seed data → verificar que los DTOs mapean correctamente |
| `src/helpers/calcMonthTotal.ts` | Lógica de suma → `CalcMonthTotal.kt` |
| `src/helpers/calcMonthComparison.ts` | Algoritmo de comparación con edge cases → `CalcMonthComparison.kt` |
| `src/helpers/groupExpensesByCategory.ts` | Agrupación + sort + porcentajes → `GroupByCategory.kt` |
| `src/helpers/exportToExcel.ts` | Columnas (Fecha, Descripción, Categoría, Importe) y formato → `ExcelExporter.kt` |
| `src/helpers/formatCurrency.ts` | Formato EUR es-ES → `CurrencyFormatter.kt` |
| `src/components/expenses/ExpensesPage.tsx` | Feature inventory completo para `ExpensesScreen` + `ExpensesViewModel` |
