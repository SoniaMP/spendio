# Estudio de coste — i18n de Spendio (es → es/en)

Fecha: 2026-09-02. Estado: **estudio, no aprobado**. No se ha tocado código.

## 1. Inventario real (medido sobre el repo, no estimado a ojo)

Barrido de literales y nodos JSX en `src/` + `server/` (excluyendo tests):

| Zona | Ficheros con copy | Cadenas |
|---|---|---|
| Componentes React | 45 | ~180 |
| Rutas Express (mensajes de error) | 9 | ~50 |
| Plantillas de email | 4 | ~30 (subject + html + text) |
| Helpers (Excel, formatos) | 2 | ~5 |
| **Total** | **59** | **~215 distintas / ~280 con duplicados** |

Contando el margen de error del barrido (falsos positivos y cadenas cortas que se le escapan), el catálogo real queda en **250–320 claves**. Es un tamaño pequeño-medio: no es un proyecto de traducción, es un proyecto de refactor.

Buena noticia: **no hay una sola cadena con interpolación ni plural**. Cero `` `Tienes ${n} gastos` ``, cero ternarios de singular/plural. Todo son literales fijos. Eso elimina de golpe la parte más cara y más frágil de cualquier i18n (ICU, reglas de plural, orden de variables).

## 2. Lo que no es "extraer strings" — los cinco puntos con coste real

Estos son los que deciden si esto son 10 horas o 25.

### 2.1 Los errores del servidor son copy de usuario
`server/routes/auth.ts:82` devuelve `{ error: 'Email o contraseña incorrectos' }`, y el cliente lo pinta tal cual: `toast.error(err.message)` (32 sitios). O sea, **el backend también habla castellano al usuario**. Dos salidas:

- **A. Códigos de error** (`INVALID_CREDENTIALS`) + diccionario en el cliente. El servidor deja de tener copy. Es lo correcto, y de paso arregla que hoy la API filtre texto de UI. Toca ~50 sitios en 9 rutas + los 32 `toast.error`.
- **B. Traducir en el servidor** por `Accept-Language`. Más rápido de escribir, pero duplica el catálogo entre cliente y servidor y no sirve para emails (ver 2.3).

Recomiendo **A**.

### 2.2 No hay idioma del usuario en la base de datos
La tabla `users` (`server/schema.ts:2`) no tiene columna de idioma. Para la UI basta con `localStorage` + idioma del navegador, pero para los emails hace falta persistirlo → **migración + endpoint + selector de idioma en la UI**. Hoy no existe ninguna pantalla de ajustes de usuario: el engranaje del header abre categorías (`AppLayout.tsx:73`). Hay que decidir dónde vive el selector.

### 2.3 Emails: la pieza más cara por cadena
4 plantillas (`accountActivation`, `passwordReset`, `recurringExpenseAlert`, `recurringExpenseDeactivated`), y cada una duplica todo el texto en HTML **y** en texto plano. Traducirlas es reescribir 8 cuerpos. Además se envían fuera del ciclo de petición (el cron de recurrentes), así que ahí no hay `Accept-Language`: dependen sí o sí de 2.2.

### 2.4 Formato de fechas y moneda
- `formatDate.ts`, `dateHelpers.ts` (×2 usos): `locale: es` de date-fns hardcodeado.
- `formatCurrency.ts`: `Intl.NumberFormat('es-ES', { currency: 'EUR' })`.

Barato de arreglar (un módulo que resuelve el locale activo), pero **ojo con la decisión de producto**: traducir el idioma ≠ cambiar de moneda. Mi recomendación es que EUR se quede fijo y solo cambie el formateo (`1.234,56 €` → `€1,234.56`). Multi-divisa es otro proyecto, y toca la base de datos.

### 2.5 Datos persistidos en castellano
`server/schema.ts:147` siembra categorías por defecto: `Alimentación`, `Transporte`, `Ocio`, `Educación`... Una vez creadas son **datos del usuario**, no UI: no se retraducen. Lo único viable es sembrarlas en el idioma del usuario en el momento del registro y asumir que quien cambie de idioma después las verá en el original. Cualquier otra cosa (tabla de traducciones de categorías) es desproporcionado aquí.

Aparte: `exportToExcel.ts` usa las claves del objeto como cabeceras (`Fecha`, `Descripción`, `Importe`) y la hoja se llama `Gastos`. Hay que separar clave técnica de etiqueta.

## 3. Los tests: el riesgo que puede duplicar la factura

53 ficheros de test, 26 de componentes, y **~196 asserts que buscan texto literal en castellano** (`getByText('Guardar')`, etc.). Si las cadenas se convierten en claves sin más, se rompen los 26 ficheros de componentes de golpe.

Mitigación, y es importante hacerlo desde el primer commit: que el `render` de test envuelva con el provider de i18n **cargando el catálogo `es` real** (no un mock que devuelva la clave). Así los asserts siguen pasando sin tocarlos y el coste de tests baja de "reescribir 196 asserts" a "tocar `src/test/setup.ts` + un helper de render". Es la diferencia entre ~2 h y ~8 h.

## 4. Librería

Para ~250 claves, 2 idiomas y cero plurales, `react-i18next` es la opción por defecto sensata: madura, detección de idioma, fallback, y el peso (~15 kB gz) es irrelevante aquí. Un diccionario propio tipado también valdría y evita dependencia, pero acabas reescribiendo el provider, el hook, el fallback y la detección — y el `CLAUDE.md` pide no inventar patrones nuevos si hay uno estándar.

## 5. Coste

Horas de trabajo real (tú dirigiendo, yo escribiendo), no tiempo de calendario:

| Fase | Horas |
|---|---|
| 1. Infra: librería, provider, convención de claves, detección, selector de idioma | 2–3 |
| 2. Extracción del frontend (45 ficheros, ~180 claves) | 4–6 |
| 3. Capa de formato (fechas, moneda) + export Excel | 1–2 |
| 4. Backend: códigos de error + columna `users.language` + migración | 2–4 |
| 5. Emails (4 plantillas × 2 idiomas × html/text) | 2–3 |
| 6. Tests: setup con catálogo real + tests de cambio de idioma y fallback | 2–3 |
| 7. Traducción al inglés y repaso de calidad de copy | 1–2 |
| **Total** | **14–23 h** |

Digamos **3–5 sesiones enfocadas**.

**Versión mínima** (solo frontend + formatos, errores del servidor mapeados por código, emails se quedan en castellano): fases 1, 2, 3, 6 y la mitad de la 4 → **8–12 h**. Deja una costura fea (el usuario en inglés recibe emails en castellano), pero es un punto de parada honesto si quieres ver resultado antes.

**Coste recurrente**: a partir de aquí cada feature nueva paga ~10–15% más, porque todo texto nace en dos idiomas. Esto no desaparece nunca.

## 6. Orden respecto a la SL

Está pendiente la conversación de ampliar Spendio para la SL. Afecta a esto en un sentido concreto: si la SL entra, trae vocabulario nuevo (facturación, IVA, ejercicio fiscal, gasto de empresa vs. personal) y el catálogo crece fácil un 30–40%. Traducir 250 cadenas hoy y 350 más luego cuesta lo mismo que traducir 600 después — el trabajo de extracción es proporcional al texto, no se ahorra esperando.

Lo que **sí** cambia con el orden es el desperdicio: si la SL reescribe pantallas enteras, habrás traducido copy que se va a tirar. Mi recomendación: **hacer las fases 1, 3 y 4 ahora** (infra, formatos, códigos de error — nada de eso se tira, y la 4 mejora la API haya o no i18n) y dejar la extracción masiva de copy (fase 2) y los emails para después de decidir el alcance de la SL.

## 6 bis. Estado de ejecución

**Fase 1 — HECHA** (infra + selector de idioma). `react-i18next` + `i18next-browser-languagedetector`.

- `src/i18n/resources.ts` es la única fuente de verdad: la lista de idiomas disponibles se deriva de sus claves, no hay constante que mantener aparte. Añadir un idioma = añadir su JSON y su import.
- Claves de traducción **comprobadas en tiempo de compilación** contra `es.json` (`src/types/i18next.d.ts`): un `t('nav.expensesTipo')` es error de build, con sugerencia de la clave correcta.
- `src/test/setup.ts` fija el idioma a `es` e inicializa i18n globalmente → **los 26 ficheros de test de componentes siguen pasando sin tocar una sola línea**, tal y como preveía la sección 3. Sin ese pin, jsdom reporta el locale del sistema y el detector se iría a inglés.
- El engranaje abre ahora `SettingsDialog` (pestañas Categorías / Idioma). `CategoriesPage` no se ha tocado.

Traducido de momento solo lo que se tocaba: navegación, cerrar sesión y el propio diálogo de ajustes. El resto es la fase 2.

**Hallazgo ajeno a i18n, pero bloqueante**: el suite de tests no arrancaba con **Node v20.16.0**. jsdom 28 y sus dependencias exigen `^20.19.0 || ^22.12.0 || >=24.0.0` (las versiones donde `require()` de un módulo ESM funciona). Con **v20.20.2**, que ya tienes instalada, pasan los 307 tests y además se mantiene el ABI nativo de `better-sqlite3` — con Node 22 habría que recompilarlo (ABI 115 vs 127). Vale la pena fijarlo con un `.nvmrc`.

## 7. Decisiones

Cerradas (2026-09-02):

- **Catálogos en el bundle** (`src/i18n/locales/*.json`), no cargados en runtime. Se valoró servirlos desde el volumen `./data` para poder editarlos en el VPS sin rebuild —`public/` no vale, porque el `Dockerfile` mete `dist/` dentro de la imagen— pero se descartó por complejidad. Coste asumido: añadir o corregir una traducción exige build y redeploy.
- **Selector de idioma**: pestaña dentro del diálogo de Ajustes, reaprovechando el engranaje que ya existía.

- **Errores del servidor: opción A, por código.** El backend deja de devolver copy; devuelve códigos (`INVALID_CREDENTIALS`) y el cliente los traduce. Toca ~50 sitios en 9 rutas + los 32 `toast.error(err.message)`.
- **Categorías: no se traducen.** Son responsabilidad del usuario. Ni tabla de traducciones ni resiembra al cambiar de idioma. Queda por decidir el detalle menor de si las categorías por defecto (`server/schema.ts:147`) se siembran en el idioma del registro o siempre en castellano.

Abiertas:

1. ¿Inglés es el único segundo idioma, o hay que dejar la puerta abierta a más (catalán, francés)?
2. ¿Moneda fija en EUR con formato localizado, o multi-divisa? (multi-divisa = otro proyecto)
3. ¿Dónde vive el selector de idioma? Hoy no hay pantalla de ajustes de usuario.
4. ¿Versión completa (14–23 h) o mínima (8–12 h) como primer entregable?
5. ¿Se hace ahora entero, o el arranque parcial de la sección 6 esperando a la SL?
