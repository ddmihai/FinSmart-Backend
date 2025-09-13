FinSmart Backend — Technical Overview

Architecture
- Runtime: Node.js, Express, TypeScript (ESM).
- Storage: MongoDB via Mongoose. Agenda uses the same Mongo for persistent jobs.
- Auth: JWT access tokens (Authorization: Bearer) + httpOnly refresh cookie on /api/auth/refresh.
- Security: helmet, CORS with allowlist, express-rate-limit, CSRF (double submit cookie via csurf), input validation with express-validator.
- Background jobs: Agenda job runs every 5 minutes to post due recurring incomes.
- PDFs: pdfkit generates statements server-side.

Key Modules
- App and server: src/app.ts, src/server.ts
- Config: src/config/env.ts (dotenv), src/config/db.ts (Mongo connection + dev in-memory fallback)
- Middleware: auth (JWT), csrf (token endpoint), validate (express-validator), error (404 + error handler)
- Models: User, Account, Card, Transaction, RecurringIncome, Budget, RefreshToken, StatementShare
- Services: tokenService, accountService, transactionService, statementService, budgetService, analyticsService, jobService
- Routes: auth, accounts, transactions, statements, budgets, analytics (mounted under /api)
- Docs: Swagger UI at /api/docs, OpenAPI at /api/openapi.json

Local Development
- Env: backend/.env (see .env.example). For development convenience, if MongoDB at MONGO_URI is not reachable, the app starts an in-memory MongoDB (mongodb-memory-server). Data is ephemeral until you run a real Mongo.
- Dev server: npm run dev (tsx watch)
- Seed demo user: npm run seed

Security Notes
- Always use HTTPS in production; set COOKIE_SECURE=true and a proper COOKIE_DOMAIN.
- Rotate JWT secrets and store in a secure secret manager.
- CSRF: Obtain a token from GET /api/security/csrf-token and send in header x-csrf-token or body _csrf for state-changing requests (POST/PUT/PATCH/DELETE).
- Rate limiting values are configurable via env.

Testing
- Jest + Supertest. MongoMemoryServer provides isolated DB instances for integration tests. CSRF is disabled under NODE_ENV=test.

Deployment
- Build: npm run build (outputs dist/)
- Start: npm start (expects MONGO_URI and all secrets set). Disable in-memory fallback in production by ensuring Mongo is reachable at boot.

