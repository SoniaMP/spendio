# Email Service — Implementation Plan

## Phase 1: Password Reset + Stub Account Activation

### Decisions

| # | Decision | Resolution |
|---|---|---|
| 1 | Email provider | **Resend** (free tier 3,000/month, $20/month to scale) |
| 2 | Sync vs queue | **Synchronous in phase 1**, queue in phase 2 for batch |
| 3 | Token storage | **New table** `password_reset_tokens` |
| 4 | TTL + rate limit | **30 min TTL**, invalidate previous tokens, **5 requests/hour/email** |
| 5 | Stub accounts in reset | **Unified flow** — reset also activates stub accounts |
| 6 | Service structure | **Service + separate templates** (`services/email.ts` + `templates/*.ts`) |
| 7 | Reset frontend | **Public routes in SPA** (`/forgot-password`, `/reset-password/:token`) |
| 8 | Non-existent email response | **Generic message always** (200 OK without revealing existence) |
| 9 | Activation email on share | **Phase 2** — stubs activate via reset for now |

### Risks

- **Deliverability:** Resend requires domain verification (SPF + DKIM). Configure DNS before writing code.
- **SQLite token cleanup:** Expired tokens accumulate. Phase 1: lazy delete when generating new tokens. Phase 2: periodic job.
- **Phase 2 scope:** Expense forecasting + batch notifications require a job queue, calculation logic, and scheduling. Plan as a separate project.

### Implementation Steps

1. Set up Resend account + verify domain DNS (SPF + DKIM)
2. `npm install resend`
3. Create migration: `password_reset_tokens` table
   - `id` INTEGER PRIMARY KEY
   - `user_id` INTEGER NOT NULL (FK to users)
   - `token_hash` TEXT NOT NULL
   - `expires_at` DATETIME NOT NULL
   - `used_at` DATETIME (NULL until consumed)
   - `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
4. Create `server/services/email.ts` — Resend wrapper (init, send)
5. Create `server/templates/passwordReset.ts` — reset email content
6. Create `server/templates/accountActivation.ts` — stub activation email content
7. Create endpoint `POST /api/auth/forgot-password`
   - Receives email
   - Returns 200 always (generic message)
   - If user exists: invalidate previous tokens, check rate limit (5/hour), generate token (crypto.randomBytes), hash it, store in DB, send email
   - If user does not exist: do nothing, return same 200
8. Create endpoint `POST /api/auth/reset-password`
   - Receives token + new password
   - Find token by hash, check not expired, check not used
   - Update user `password_hash` (works for both reset and stub activation)
   - Mark token as used (`used_at = now`)
   - Lazy delete: remove expired tokens for this user
9. Create frontend route `/forgot-password`
   - Email input form
   - Success message (generic, always the same)
10. Create frontend route `/reset-password/:token`
    - New password + confirm password form
    - Validates token via API, shows error if invalid/expired
    - On success, redirects to login
11. Tests
    - Unit: token generation, hashing, expiration logic
    - Integration: both endpoints (happy path, expired token, used token, rate limit, stub account activation)
    - Frontend: both forms render and submit correctly

## Phase 2: Expense Forecasting Notifications (future)

- Add job queue (BullMQ + Redis, or SQLite-based queue)
- Add `POST /api/sheets/:id/shares` email notification on stub account creation
- Add expense forecast calculation logic
- Add forecast notification templates
- Add periodic cleanup job for expired tokens
