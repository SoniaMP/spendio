# Spendio

A full-stack web application to track personal expenses. Organize spending into categories and sheets, visualize monthly breakdowns with charts, compare spending across months, and export data to Excel.

## Features

- **Expense tracking** — Add, edit, and delete expenses with date, amount, description, and category.
- **Multiple sheets** — Separate expenses into different sheets (e.g., personal, shared, trips).
- **Month navigation** — Filter expenses by month and compare totals against previous months.
- **Category management** — Create and manage custom spending categories.
- **Charts** — Pie and bar charts showing spending distribution by category.
- **Monthly summary** — View totals per category with month-over-month comparison.
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

- Node.js (v20 or later recommended)
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
npm run dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`

The SQLite database is created automatically in the `data/` directory on first run.

### Dev Login (bypass Google auth)

When `VITE_AUTH_BYPASS=true` is set in `.env`, the login page shows a **Dev Login** button that authenticates as a local dev user without needing Google credentials. Remove the variable or set it to `false` to restore the normal Google login flow.

### Other Commands

```bash
npm run lint       # Run ESLint
npm test           # Run tests
npm run build      # Build for production
npm start          # Start the production API server
```
