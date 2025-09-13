FinSmart Backend (Node.js + Express + TypeScript)

Setup
- Copy `.env.example` to `.env` and update secrets.
- Install deps: `npm install`
- Start dev: `npm run dev`
- Run tests: `npm test`

Key Tech
- Express, Mongoose, Agenda (recurring jobs), JWT (access + refresh), httpOnly cookies, CSRF via `csurf`, rate limiting, helmet, input validation with `express-validator`.

API Overview (selected)
- `POST /api/auth/signup` — email, name, password
- `POST /api/auth/login` — email, password
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me` — requires Bearer access token
- `GET /api/security/csrf-token` — obtain CSRF token for POST/PUT/DELETE

- `GET /api/accounts` — list user accounts
- `POST /api/accounts` — create new account (optional `type`)
- `GET /api/accounts/cards` — list active cards
- `POST /api/accounts/:accountId/replace-card`

- `POST /api/transactions/income` — amount (pence), name, optional recurring
- `POST /api/transactions/expense` — amount (pence), name
- `POST /api/transactions/deposit` — add funds
- `POST /api/transactions/transfer` — toName, toSortCode, toAccountNumber, amount
- `GET /api/transactions?accountId=...` — filters: from, to, name, q, min, max

- `GET /api/statements?accountId=...` — summary
- `GET /api/statements/download?accountId=...` — PDF download
- `POST /api/statements/share` — body: accountId, ttlHours, filters
- `GET /api/statements/shared/:token` — view shared statement

- `POST /api/budgets` — category, limit (pence)
- `GET /api/budgets/usage` — current month usage by category

- `GET /api/analytics?accountId=...` — monthly overview

Auth
- Access token in `Authorization: Bearer <token>`.
- Refresh token issued as httpOnly cookie at `/api/auth/refresh`. Rotate by calling refresh.

Jobs
- Agenda runs `process recurring incomes` every 5 minutes; uses Mongo for persistence.

Testing
- Jest + Supertest + MongoMemoryServer. See `tests/`.

