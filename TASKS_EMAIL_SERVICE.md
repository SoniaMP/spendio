# Email Service — Development Tasks

## Phase 1: Password Reset + Stub Account Activation

### Setup

| # | Task | Depends on | Size | Notes |
|---|------|-----------|------|-------|
| 1 | Create Resend account, verify domain (SPF + DKIM DNS records) | — | S | Manual. Must complete before any email code works. |
| 2 | `npm install resend`, add `RESEND_API_KEY` to `.env` | 1 | S | |

### Backend — Data Layer

| # | Task | Depends on | Size | Notes |
|---|------|-----------|------|-------|
| 3 | Create migration: `password_reset_tokens` table (id, user_id FK, token_hash, expires_at, used_at, created_at) | — | S | |

### Backend — Email Service

| # | Task | Depends on | Size | Notes |
|---|------|-----------|------|-------|
| 4 | Create `server/services/email.ts` — Resend wrapper (init client, `sendEmail` function) | 2 | S | |
| 5 | Create `server/templates/passwordReset.ts` — reset email subject + HTML/text body | 4 | S | Receives reset URL, returns email content. |
| 6 | Create `server/templates/accountActivation.ts` — stub activation email subject + HTML/text body | 4 | S | Different wording, same token mechanism. |

### Backend — Endpoints

| # | Task | Depends on | Size | Notes |
|---|------|-----------|------|-------|
| 7 | `POST /api/auth/forgot-password` — full flow: validate rate limit (5/hr), invalidate previous tokens, generate token (`crypto.randomBytes`), hash + store, send email, always return 200 | 3, 4, 5, 6 | L | Core endpoint. Includes rate limit logic, token generation, lazy cleanup of expired tokens. Choose template based on whether user has a password (reset vs activation). |
| 8 | `POST /api/auth/reset-password` — validate token by hash, check not expired/used, update `password_hash`, mark token used, lazy delete expired tokens for user | 3 | M | Works for both reset and stub activation (both just set `password_hash`). |

### Frontend

| # | Task | Depends on | Size | Notes |
|---|------|-----------|------|-------|
| 9 | Add public route `/forgot-password` — `ForgotPasswordPage`: email input, submit calls forgot-password API, shows generic success message always | 7 | M | Public route (no auth). Add link from login page. |
| 10 | Add public route `/reset-password/:token` — `ResetPasswordPage`: new password + confirm, submit calls reset-password API, redirect to `/login` on success, show error if invalid/expired | 8 | M | Public route (no auth). |

### Tests

| # | Task | Depends on | Size | Notes |
|---|------|-----------|------|-------|
| 11 | Unit tests: token generation, hashing, expiration check, rate limit logic | 7, 8 | M | |
| 12 | Integration tests: both endpoints — happy path, expired token, used token, rate limit exceeded, stub account activation | 7, 8 | L | Mock Resend SDK to avoid real emails in tests. |
| 13 | Frontend tests: both forms render, validate, submit, show success/error states | 9, 10 | M | |

### Task Order (Critical Path)

```
1 → 2 → 4 → 5, 6      (setup → email service → templates)
        ↘
3 ────────→ 7 → 9      (migration → forgot-password → frontend)
         ↘→ 8 → 10     (migration → reset-password → frontend)
                  ↘
              11, 12, 13 (tests after features)
```

Parallelizable:
- **3** and **1, 2** can run in parallel (migration doesn't need Resend)
- **5** and **6** can run in parallel (independent templates)
- **9** and **10** can run in parallel (independent pages, different endpoint deps)
- **11**, **12**, **13** can run in parallel (independent test suites)

---

## Phase 2: Expense Forecasting Notifications (future scope)

| # | Task | Depends on | Size | Notes |
|---|------|-----------|------|-------|
| 14 | Add job queue (BullMQ + Redis or SQLite-based) | Phase 1 | L | Architectural decision needed: Redis dependency vs SQLite-based queue. |
| 15 | Send activation email on `POST /api/sheets/:id/shares` when stub account is created | Phase 1, 14 | M | Queue the email instead of sending sync. |
| 16 | Expense forecast calculation logic | Phase 1 | L | Needs design: what triggers a forecast, what data is used, thresholds. |
| 17 | Forecast notification email templates | 16 | S | |
| 18 | Scheduled job: send forecast notifications | 14, 16, 17 | L | Cron or queue-based scheduling. |
| 19 | Periodic cleanup job for expired tokens | 14 | S | Replace Phase 1 lazy deletion with scheduled cleanup. |

---

## Summary

| Phase | Tasks | S | M | L |
|-------|-------|---|---|---|
| 1 | 13 | 5 | 5 | 3 |
| 2 | 6 | 2 | 1 | 3 |
