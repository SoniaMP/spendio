# Session Timeout — Plan de implementación

## Objetivo
Expirar la sesión tras 1 hora de inactividad, con aviso previo al usuario.

## Cambios

### 1. Backend — `server/session.ts`
- Cambiar `maxAge` de 7 días a **1 hora** (3 600 000 ms)
- Añadir `rolling: true` para renovar la cookie en cada request (resetea el timer de inactividad)
- Cambiar `resave: true` para que el store actualice la sesión en cada request

### 2. Frontend — `src/hooks/useSessionTimeout.ts` (nuevo)
- Hook que usa un timer interno para rastrear inactividad
- Escucha eventos de actividad: `mousedown`, `keydown`, `touchstart`, `scroll`
- A los **55 minutos** de inactividad → mostrar aviso ("Tu sesión expirará en 5 minutos")
- A los **60 minutos** → llamar a logout y redirigir a `/login`
- Si el usuario interactúa durante el aviso → resetear el timer y hacer un ping a `/api/auth/me` para renovar la sesión en el servidor
- Limpiar listeners y timers en cleanup

### 3. Frontend — `src/components/auth/SessionWarning.tsx` (nuevo)
- Dialog/modal con mensaje: "Tu sesión expirará en X minutos por inactividad"
- Botón "Continuar sesión" que resetea el timer
- Countdown en tiempo real de los minutos/segundos restantes

### 4. Frontend — `src/components/auth/ProtectedRoute.tsx` (modificar)
- Integrar `useSessionTimeout` para que esté activo en todas las rutas protegidas
- Renderizar `<SessionWarning />` cuando corresponda

## Constantes
- `SESSION_MAX_AGE = 60 * 60 * 1000` (1 hora) — compartida o duplicada backend/frontend
- `WARNING_BEFORE_MS = 5 * 60 * 1000` (5 minutos antes de expirar)
