# Spendio

A full-stack web application to track personal expenses. Organize spending into categories and sheets, visualize monthly breakdowns with charts, compare spending across months, and export data to Excel.

## Features

- **Expense tracking** — Add, edit, and delete expenses with date, amount, description, and category.
- **Recurring expenses** — Templates that generate expenses monthly or yearly, with an email reminder ahead of each charge.
- **Multiple sheets** — Separate expenses into different sheets (e.g., personal, shared, trips).
- **Month navigation** — Filter expenses by month and compare totals against previous months.
- **Category management** — Create and manage custom spending categories.
- **Charts** — Pie and bar charts showing spending distribution by category.
- **Monthly summary** — View totals per category with month-over-month comparison.
- **Monthly income** — Optional income lines per user; shows what is left of the month after your expenses on every sheet.
- **Category filter** — Filter the expenses table by a specific category.
- **Excel export** — Download the current month's expenses as an `.xlsx` file.

## Tech Stack

| Layer     | Technology                                                  |
| --------- | ----------------------------------------------------------- |
| Frontend  | React 19, TypeScript, Tailwind CSS 4, Radix UI (shadcn/ui) |
| Routing   | React Router 7                                              |
| State     | TanStack React Query                                        |
| Charts    | Recharts                                                    |
| Backend   | Express 5, TypeScript (tsx)                                 |
| Database  | SQLite (better-sqlite3)                                     |
| Build     | Vite 7                                                      |
| Testing   | Vitest, Testing Library                                     |
| Linting   | ESLint 9                                                    |

## Getting Started

### Prerequisites

- Node.js **22.19.0** — the version pinned in `.nvmrc` and enforced by `engines`.
  Run `nvm use` before anything else. Older 20.x releases break Vite and jsdom,
  and switching major versions requires `npm rebuild better-sqlite3`.
- npm

### Installation

```bash
git clone <repo-url>
cd spendio
npm install
```

### Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID for authentication |
| `SESSION_SECRET` | Yes | Secret used to sign session cookies (change in production) |
| `VITE_AUTH_BYPASS` | No | Set to `true` to enable the Dev Login button (skips Google auth) |

The `.env` file is loaded automatically by the `dev:server` script via `--env-file`.

### Running Locally

Start both the client (Vite dev server) and the API server concurrently:

```bash
nvm use      # Node 22.19.0, see Prerequisites
npm run dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`

The SQLite database is created automatically in the `data/` directory on first run.

### Docker

```bash
docker compose up --build -d   # build image and start
docker compose logs -f         # follow logs
docker compose down            # stop
```

Serves the built frontend and the API on `http://localhost:3001`.

`--build` is required after any change under `server/`, `shared/` or `src/` — the
image copies them at build time and there is no bind mount. `./data` is bind-mounted,
so the SQLite database survives rebuilds.

Reads `.env` via `env_file`. `VITE_GOOGLE_CLIENT_ID` is inlined at build time, so
changing it requires `--build`.

### Test account

| Email | Password |
|-------|----------|
| `test@spendio.es` | `admin123` |

Sign in with it on the login page.

### Switching language

Spanish and English catalogs live in `src/i18n/locales/`. Use the globe
dropdown, available on the login screens and in the app header. The choice is
stored in `localStorage` under `spendio.language`; with nothing stored, the
browser language decides, falling back to Spanish.

### Other Commands

```bash
npm run lint              # Run ESLint
npm test                  # Run tests
npm run build             # Build for production
npm start                 # Start the production API server
npm run db:clear-tokens   # Delete all password-reset tokens
npm run db:clear-tokens 5 # Delete tokens for user ID 5 only
```
