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
- El engranaje abría `SettingsDialog` con pestañas Categorías / Idioma. **Revertido en la fase 2.5**: ahora abre `CategoriesDialog` sin pestañas y el idioma vive en un desplegable. `CategoriesPage` no se ha tocado en ningún momento.

Traducido de momento solo lo que se tocaba: navegación, cerrar sesión y el propio diálogo de ajustes. El resto es la fase 2.

**Fase 2 — HECHA** (extracción del frontend). 45 componentes, **207 claves** en `es` y `en`. 307 tests verdes, `tsc` y `eslint` limpios.

- Los 26 ficheros de test de componentes siguen **sin tocarse**: los ~196 asserts en castellano pasan porque el catálogo `es` devuelve exactamente el mismo texto. Cualquier cambio accidental de copy los habría roto, así que sirven de red de seguridad del refactor.
- Tests nuevos: `src/__tests__/i18n/catalogs.test.ts` (los dos catálogos tienen las mismas claves, sin valores vacíos y con las mismas variables de interpolación) y `languageSwitch.test.tsx` (la UI cambia de idioma, se conservan valores y marcado interpolados, y un idioma desconocido cae al catálogo de referencia).
- **Corrección a la sección 1**: sí había interpolaciones, cinco. El barrido inicial solo miraba template literals y se le escaparon las que viven en JSX. Cuatro llevan marcado dentro de la frase y se resuelven con `<Trans>` (`SessionWarning`, `ExpenseDeleteDialog`, `CategoryDeleteDialog`, `RecurringExpenseDeleteDialog`, `SheetShareDialog`, `RecurringExpenseRow`); el resto son valores simples (`MonthComparisonBadge`, `CategoryRow`, `SheetDeleteDialog`). No cambia la estimación.
- **Erratas preexistentes conservadas a propósito**: `Organiza gastos por categorias`, `Graficos y comparativas mensuales`, `Iniciar sesion` y `Se le compartira` van sin tilde en el código actual. Se han copiado tal cual al catálogo `es` para que esto sea un refactor puro; corregirlas es un cambio de copy aparte (y romperá el assert `'Iniciar sesion'` de `LoginPage.test`).

Pendiente y consciente, va en la fase 3: `exportToExcel.ts` (cabeceras `Fecha/Descripción/Importe` y hoja `Gastos`), el `.replace('.', ',')` de `MonthComparisonBadge`, y el `locale: es` de date-fns.

Commits: `cc01ef7` (fase 1), `98c2be8` (fase 2), `3a2ea0d` (README), `26b1295` (pin de Node).

---

## Fase 2.5 — HECHA: el selector de idioma sale de Ajustes

Decidida y ejecutada 2026-09-15. 307 tests verdes, `tsc`, `eslint` y `vite build` limpios.

**El problema.** El selector solo existe tras el login, así que un usuario nuevo se come las pantallas de acceso en un idioma que no eligió — y son tres (`login`, `forgot-password`, `reset-password/:token`), no una. Es justo donde más importa y donde hoy no hay forma de cambiarlo.

**La decisión.** Un desplegable de idioma visible en las pantallas pre-login **y** en la cabecera de la app, que **sustituye** a la pestaña Idioma de Ajustes. No se queda en los dos sitios.

Esto revierte parte de la fase 1, donde se eligió la pestaña con el argumento de que «el idioma se toca una vez en la vida». Sigue siendo cierto para quien ya entró; deja de serlo para quien no ha entrado todavía. El caso de uso es nuevo, así que la conclusión cambia.

**Sin banderas.** Las banderas son países, no idiomas: «español» no es España (¿y México?), «inglés» no es Reino Unido (¿y EEUU?), y con catalán sería un asunto político. Se usa el **código de idioma** (`ES` / `EN`) en el disparador, un icono de globo (`Globe` de lucide) como pista visual, y los **nombres nativos** en las opciones — que ya salen solos de `Intl.DisplayNames`, así que un idioma nuevo aparece sin tocar código.

### Tareas técnicas (todas completadas)

- [x] **Nuevo `src/components/i18n/LanguageDropdown.tsx`** — `DropdownMenu` (ya existe en `ui/`) con icono `Globe` + código del idioma activo; opciones con los nombres nativos y marca en el activo. Deriva la lista de `resources` igual que el `LanguageSelector` actual.
- [x] **Nuevo `src/components/auth/AuthLayout.tsx`** — envuelve las tres rutas pre-login. Se queda con lo que hoy está triplicado: el `div` de fondo con gradiente, la `Card`, el icono `Wallet` y el desplegable arriba a la derecha. **Cada página conserva su propio `h1` y su descripción**, que son distintos en las tres.
- [x] **`App.tsx`** — meter las tres rutas pre-login dentro de una `<Route element={<AuthLayout />}>`.
- [x] **Las tres páginas de auth** — quitarles el envoltorio duplicado (`min-h-screen`, `Card`, `CardHeader` con el `Wallet`), dejando solo su contenido. Esto elimina la triplicación que ya existía.
- [x] **`AppLayout.tsx`** — añadir el desplegable en la cabecera, junto al avatar. El engranaje pasa a abrir solo categorías.
- [x] **Nuevo `src/components/categories/CategoriesDialog.tsx`** — lo que hoy hace `SettingsDialog` pero sin pestañas. Se extrae en su componente en vez de devolverlo al `AppLayout` inline, para no engordar el layout.
- [x] **Borrar**: `src/components/settings/SettingsDialog.tsx`, `src/components/settings/LanguageSelector.tsx`, `src/__tests__/components/settings/` (los dos tests) y el directorio `src/components/settings/` entero.
- [x] **Catálogos** — desaparece la sección `settings` completa (`title`, `tabs.*`, `language.*`): con el selector fuera y el diálogo reducido a categorías, no queda nada que nombrar ahí. Añadir `categories.title` para el título del diálogo y el `title` del engranaje (hoy usa `settings.title`, ver `AppLayout.tsx:70`). Añadir `language.label` para el `aria-label` del desplegable.
- [x] **Tests nuevos**: el desplegable (lista idiomas, marca el activo, cambia el idioma) y —el que de verdad cubre el fallo— que **desde la pantalla de login se puede cambiar el idioma**, que es lo que hoy no se puede.
- [x] **`README.md`** — la sección «Switching language» dice «gear icon in the header → Idioma / Language» y queda falsa. Actualizar en una línea.

### Cómo quedó

- `AuthLayout` se quedó solo con el envoltorio (fondo, `Card`, desplegable). El icono `Wallet` habría seguido triplicado, así que salió además un `AuthHeader` (icono + título + descripción opcional) que usan las tres páginas. Eran dos componentes en vez de uno, pero es lo que elimina de verdad la duplicación.
- Los tests de las tres páginas de auth **pasaron sin tocar una línea**, como se preveía.
- Test que cubre el fallo original: `src/__tests__/components/auth/AuthLayout.test.tsx` → «lets a visitor change the language before signing in».

### Riesgos comprobados (antes de ejecutar)

- **Los tests de las páginas de auth deberían sobrevivir**: renderizan los componentes directamente (`render(<LoginPage />)`) y solo assertan contenido (`'Spendio'`, la tagline, labels, botones), nada de la estructura que se va a `AuthLayout`. Los `h1` se quedan en cada página. Verificar al ejecutar.
- **`settings.title` solo se usa en un sitio** (`AppLayout.tsx:70`), así que retirar la sección del catálogo es de bajo riesgo. El test `catalogs.test.ts` cazará cualquier desincronía entre `es` y `en`.
- **El desplegable no necesita providers**: no usa queries, y `App.tsx` envuelve todas las rutas en `QueryClientProvider` de todos modos. En los tests se puede renderizar suelto.

---

## Fase 3 — HECHA: capa de formato

Ejecutada 2026-09-15. 313 tests verdes, `tsc`, `eslint` y `vite build` limpios.

- **Nuevo `src/i18n/activeLocale.ts`** — resuelve el locale activo para los helpers, que al ser funciones puras no pueden usar `useTranslation`. Expone `getDateLocale()` (date-fns) y `getIntlLocale()` (`Intl`). Los dos mapas se tipan con `Record<keyof typeof resources, ...>`, así que añadir un idioma a `resources` sin darle locale **es error de compilación**: no se introduce una segunda lista de idiomas que mantener. Los locales de date-fns se importan estáticamente a propósito.
- **`formatDate` y `formatDateRangeLabel` pasan de `'d MMM yyyy'` a `'PP'`.** Hallazgo de la fase: con un patrón explícito, date-fns **solo traduce el nombre del mes y mantiene el orden de campos español** — salía `4 Mar 2026` en inglés. El token localizado `PP` sí reordena: `4 mar 2026` en castellano (idéntico a antes, byte a byte) y `Mar 4, 2026` en inglés.
- **`formatCurrency`**: EUR fijo, formateo por locale. El formatter estaba creado a nivel de módulo, así que se memoiza en un `Map` por locale; si no, el cambio de idioma no se reflejaba. `1234,50 €` → `€1,234.50`.
- **`MonthComparisonBadge`**: fuera el `.replace('.', ',')` manual, ahora `Intl.NumberFormat`.
- **`exportToExcel`**: cabeceras, nombre de hoja y nombre de fichero traducidos (`gastos-…xlsx` → `expenses-…xlsx`). `json_to_sheet` usa las claves del objeto como cabeceras, así que las claves **son** las etiquetas traducidas y `ExportRow` pasa a `Record<string, string>`. Usa `i18next.t` directamente, igual que `activeLocale`, por no ser un hook.
- **Coste en bundle**: +0,68 kB. Confirmado que no entraron los ~100 locales de date-fns.
- **Los 5 ficheros de test que se preveía romper pasaron sin tocarse**, porque en castellano la salida es idéntica. El caso inglés se añadió aparte en `src/__tests__/i18n/formatting.test.ts` y en un bloque nuevo de `MonthComparisonBadge.test.tsx`, incluida la vuelta a formato español con un idioma no soportado.

---

## Fase 4 — HECHA: códigos de error del servidor + idioma del usuario

Ejecutada 2026-09-15. 327 tests verdes, `tsc`, `eslint` y `vite build` limpios.

- **Nuevo `shared/errorCodes.ts`** — contrato compartido entre API y cliente, con el patrón const-object del `CLAUDE.md`. Hizo falta un directorio `shared/` nuevo, incluido en `tsconfig.app.json` y `tsconfig.server.json`, con alias `@shared/*` en `tsconfig.app.json`, `vite.config.ts` y `vitest.config.ts`.
- **56 sustituciones en 7 rutas**: el servidor ya no devuelve una sola cadena en castellano. Verificado con grep.
- **`errorHandler` ya no filtra `err.message` al cliente** — antes mandaba el texto crudo de SQLite en el campo `detail`.
- **Cliente**: `src/lib/errorMessage.ts` con `getErrorMessage` (traduce el código, cae a un mensaje genérico si no lo conoce, así que nunca se pinta un identificador crudo) e `isErrorCode`. 17 `toast.error(err.message)` más 5 sitios que pintaban el error en pantalla.
- **`CategoryDeleteDialog` deja de olfatear texto**: antes buscaba `'restrict'`/`'constraint'`/`'foreign'` dentro del mensaje; ahora compara con `ErrorCode.CategoryHasExpenses`.
- **Columna `users.language`** con migración para BDs existentes (verificada contra un backup anterior: añade la columna y deja los usuarios en `es`), presente también en el `CREATE TABLE` y en el rebuild de `users_new`. Expuesta en `GET /me`.
- **`PATCH /api/auth/language`** valida contra los idiomas soportados. `useLanguageSync` lo llama desde `AppLayout` cuando el idioma cambia y hay sesión; los fallos se ignoran a propósito, porque la UI ya funciona sin esto.
- **El registro siembra el idioma activo**, así que quien se registre en inglés no recibe emails en castellano.
- **Dos `message` en castellano eran copy muerta**: `/forgot-password` y `/reset-password` los devolvían y ningún componente los pintaba (las pantallas muestran su propio texto traducido). Ahora responden `{ success: true }`.
- **Corrección a lo dicho en su momento**: sí había tests de servidor asserteando mensajes en castellano — 4, con `expect.objectContaining`, que el primer grep no cogió. Pasan a assertar códigos.

## Fase 5 — HECHA: emails en los dos idiomas

Ejecutada 2026-09-24. 343 tests verdes, `tsc`, `eslint` y `vite build` limpios. **Con esto el i18n está completo: no queda copy en castellano fuera de los catálogos.**

- **Nuevo `shared/languages.ts`** — fuente única de idiomas (`Language`, `SUPPORTED_LANGUAGES`, `DEFAULT_LANGUAGE`, `resolveLanguage`). Lo usan el servidor, las plantillas, `activeLocale`, `config` y el desplegable. `auth.ts` tenía su propia lista `['es','en']` hardcodeada.
- **Nuevo `server/templates/emailLayout.ts`** — el envoltorio que las 4 plantillas repetían (div, cabecera, botón, nota, pie). Cada plantilla lleva su copy en un `Record<Language, ...>`, así que **añadir un idioma sin traducir un email es error de compilación**.
- **`recurringExpenseAlert`**: fuera `formatDateEs` y `formatAmountEs` (que hacían `.replace('.', ',')` a mano); ahora `Intl` con el locale, EUR fijo igual que en la UI. El formateo de fecha va con `timeZone: 'UTC'` para que el día no se desplace según dónde corra el cron.
- **Llamantes**: `auth.ts` pasa `resolveLanguage(user.language)`; `recurringScheduler.fetchUser` añade `language` a su `SELECT`.
- **Tests**: `server/__tests__/templates/emailTemplates.test.ts` recorre los 4 emails × 2 idiomas comprobando asunto/html/texto no vacíos, saludo, pie una sola vez y cero placeholders sin resolver, más los formatos de importe y fecha por idioma.
- **Deuda de la fase 4 saldada**: había dejado en `auth.ts` el comentario «Kept in sync with the client catalogs by a test» y ese test **no existía**. Ahora sí: `src/__tests__/i18n/supportedLanguages.test.ts` comprueba que `SUPPORTED_LANGUAGES` y los catálogos del cliente coinciden exactamente.

### Estado final del i18n

Fases 1, 2, 2.5, 3, 4 y 5 hechas. 343 tests. Lo que queda son decisiones de producto, no trabajo pendiente:

- Añadir un tercer idioma = un JSON en `src/i18n/locales/`, su entrada en `resources.ts` y en `shared/languages.ts`; el compilador y los tests señalan todo lo que falte (locale de date-fns, `Intl`, copy de los 4 emails).
- Corregir una traducción sigue exigiendo build y redeploy (decisión consciente, ver sección 7).
- Erratas preexistentes del castellano conservadas a propósito (`categorias`, `Graficos`, `Iniciar sesion`, `Se le compartira`). Corregirlas es un commit de copy aparte y romperá el assert `'Iniciar sesion'` de `LoginPage.test`.

**Recordatorio de entorno**: `nvm use` (Node 22.19.0). Cuenta de test local: `test@spendio.es` / `admin123`.

**Deuda anotada, fuera del alcance de i18n:**
- El `engine-strict` solo cubre `npm install`, no `npm run dev`. Falta un script `predev` que compruebe la versión de Node y falle diciendo «ejecuta `nvm use`».
- El README documenta `VITE_GOOGLE_CLIENT_ID` como obligatoria y `VITE_AUTH_BYPASS`; **ninguna de las dos existe en el código**.
- El bundle va por 1,33 MB y Vite avisa en cada build.
- **El envío de correo estaba roto en silencio, y ya no.** `RESEND_FROM_EMAIL=no-reply@email.com` usa un dominio ajeno: Resend responde 403 «The email.com domain is not verified». Y el SDK **no lanza** en error, devuelve `{ data, error }`, que `sendEmail` descartaba — un envío rechazado era indistinguible de uno correcto. Ahora `sendEmail` comprueba `error`, registra el motivo y lanza `EmailDeliveryError`; `/forgot-password` devuelve 500 en vez de fingir éxito. El cron aísla el fallo por plantilla: un email rechazado ya no aborta la generación de los demás, y no marca el recordatorio como enviado, así que se reintenta en la siguiente pasada.
- **Acción tuya pendiente**: verificar `soniadev.es` en resend.com/domains y poner `RESEND_FROM_EMAIL=no-reply@soniadev.es` en el `.env` local **y en el del VPS**. Hasta entonces no sale ningún correo, ni en local ni en producción. Ningún email se ha enviado nunca en inglés (ni en castellano, con esa configuración).

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
