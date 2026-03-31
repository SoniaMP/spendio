# PRD: Email Service — Password Reset & Stub Account Activation

## Problem Statement

Spendio users have no way to recover their accounts when they forget their password. Additionally, users invited to shared sheets via email ("stub accounts") have no activation flow — they exist in the database but cannot set a password or log in. Both problems block user retention and collaboration.

## Solution

Add an email service (Resend) with two flows that share the same token-based mechanism:

1. **Password reset:** Existing users request a reset link via email, click it, and set a new password.
2. **Stub account activation:** Stub users (created when a sheet is shared with an unregistered email) activate their account through the same reset flow — setting a password effectively activates the account.

Both flows use a single token table and the same endpoints, keeping the implementation simple.

## User Stories

### Core

1. As a **registered user**, I want to request a password reset by email, so that I can regain access to my account when I forget my password.
2. As a **registered user**, I want to set a new password via a secure link, so that I can log in again after a reset.
3. As a **stub account user**, I want to receive a reset link and set my password, so that I can activate my account and access shared sheets.

### Security & Edge Cases

4. As a **user**, I expect the system to never reveal whether an email exists, so that my account cannot be enumerated by attackers.
5. As a **user**, I expect previous reset tokens to be invalidated when I request a new one, so that old links cannot be reused.
6. As a **user**, I expect reset links to expire after 30 minutes, so that stale links cannot be exploited.
7. As a **user**, I expect to be rate-limited to 5 reset requests per hour, so that the system is protected from abuse.
8. As a **user**, I expect a used reset link to stop working, so that someone with access to my email history cannot reuse it.
9. As a **user**, I expect to be redirected to login after a successful reset, so that I can immediately access my account.

## Implementation Decisions

### Email Provider

Resend. Free tier covers 3,000 emails/month, sufficient for current scale. Requires domain verification (SPF + DKIM) before sending.

### Token Lifecycle

- Tokens are generated with `crypto.randomBytes`, hashed before storage (never stored in plaintext).
- 30-minute TTL. One active token per user at a time (previous tokens invalidated on new request).
- Tokens marked as used after consumption (`used_at` timestamp). Expired tokens lazily cleaned up when generating new ones.

### API Design

| Endpoint | Method | Auth | Behavior |
|---|---|---|---|
| `/api/auth/forgot-password` | POST | Public | Accepts `{ email }`. Always returns 200 with generic message. Internally: validates rate limit, invalidates old tokens, generates new token, sends email. |
| `/api/auth/reset-password` | POST | Public | Accepts `{ token, password }`. Validates token (exists, not expired, not used). Updates `password_hash`. Marks token used. Returns success or error. |

### Data Model

New table `password_reset_tokens`:

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `user_id` | INTEGER NOT NULL | FK to `users` |
| `token_hash` | TEXT NOT NULL | SHA-256 of the raw token |
| `expires_at` | DATETIME NOT NULL | `created_at + 30 min` |
| `used_at` | DATETIME | NULL until consumed |
| `created_at` | DATETIME | Default `CURRENT_TIMESTAMP` |

### Frontend Routes

| Route | Component | Behavior |
|---|---|---|
| `/forgot-password` | `ForgotPasswordPage` | Email input. Shows generic success message on submit (regardless of whether email exists). Link from login page. |
| `/reset-password/:token` | `ResetPasswordPage` | Password + confirm password form. Validates token on submit. Redirects to `/login` on success. Shows error if token is invalid/expired. |

Both are public routes (no auth required).

### Service Structure

- `server/services/email.ts` — Resend SDK wrapper (init + send).
- `server/templates/passwordReset.ts` — Reset email HTML/text content.
- `server/templates/accountActivation.ts` — Stub activation email content (different wording, same token mechanism).

### Synchronous Sending

Emails are sent synchronously in the request handler (Phase 1). A job queue for batch/scheduled emails is deferred to Phase 2.

## MVP Scope

### Included (Phase 1)

- Resend integration with domain verification
- `password_reset_tokens` table and migration
- `POST /api/auth/forgot-password` endpoint
- `POST /api/auth/reset-password` endpoint
- Token generation, hashing, expiration, rate limiting
- Lazy cleanup of expired tokens
- Password reset email template
- Stub account activation email template
- `/forgot-password` frontend page
- `/reset-password/:token` frontend page
- Unit and integration tests

### Excluded (Phase 2)

- Job queue for async/batch emails
- Email notification on sheet share (stub account creation trigger)
- Expense forecasting notifications
- Periodic token cleanup job
- Email preference settings

## Risks

### Technical

- **Deliverability:** Resend requires DNS verification (SPF + DKIM). If not configured correctly, emails land in spam. Must be done before any code ships.
- **SQLite token accumulation:** Without a periodic cleanup job, expired tokens accumulate. Lazy deletion on new token generation mitigates but doesn't fully solve. Acceptable for Phase 1 volume.
- **Synchronous email latency:** Resend API calls add latency to the forgot-password endpoint. Mitigated by always returning 200 quickly (could fire-and-forget internally if needed).

### Product

- **Stub account UX gap:** Until Phase 2, stub users don't receive an automatic activation email on share. They must manually go to `/forgot-password` to activate. This may cause confusion.
- **No email change flow:** If a user loses access to their email, there's no recovery path. Out of scope but worth noting.

### Adoption

- Low risk. Password reset is table-stakes functionality that users expect.

## Testing Strategy

### Unit Tests

- Token generation produces correct length and randomness.
- Token hashing is deterministic and irreversible.
- Expiration logic correctly identifies expired vs valid tokens.
- Rate limit logic correctly counts requests within the window.

### Integration Tests

- **Forgot password:** Happy path (email sent), non-existent email (still 200), rate limit exceeded (429).
- **Reset password:** Happy path (password updated, token marked used), expired token (rejected), already-used token (rejected), invalid token (rejected).
- **Stub activation:** Stub account with null `password_hash` gets activated through reset flow.

### Frontend Tests

- Both forms render correctly.
- Form validation (empty fields, password mismatch).
- Success and error states display correctly.
- Navigation: login page links to forgot-password, successful reset redirects to login.

## Out of Scope

- Email verification on registration
- Email change/update flow
- Admin dashboard for email analytics
- Custom email branding/templates beyond functional HTML
- OAuth account recovery (Google OAuth users don't need password reset)
- Two-factor authentication
- Batch/scheduled email notifications

## Next Steps

1. **DNS setup:** Create Resend account, add domain, configure SPF + DKIM records. Verify deliverability.
2. **Install dependency:** `npm install resend`
3. **Backend:** Migration, email service, templates, endpoints (steps 3-8 from the plan).
4. **Frontend:** Both public routes and forms (steps 9-10 from the plan).
5. **Tests:** Full coverage per testing strategy (step 11 from the plan).
6. **Manual QA:** End-to-end test with real email delivery on staging.
