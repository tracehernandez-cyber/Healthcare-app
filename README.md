# Healthcare app
Postoperative educational web app (optional smartphone app)
## Architecture & Decisions

### Why PostgreSQL?
- Relational data + strong consistency: our domain (clinics, users, patients, enrollments, pathways) is relationship-heavy and benefits from constraints and transactions.
- Mature + reliable: Postgres is stable, widely supported, and easy to host locally and in production.
- Great long-term flexibility: supports indexing, JSON fields when needed, and advanced querying as the product grows.

### Why Prisma?
- Schema as code: `prisma/schema.prisma` is the source of truth for models and relationships.
- Type safety: Prisma Client generates typed queries, reducing runtime bugs and speeding development.
- Migrations built-in: database changes are tracked in `prisma/migrations/` so environments stay in sync.

### Why this folder layout?
This API follows a separation-of-concerns layout so it stays readable as it scales:

- `src/routes/` = URL + HTTP wiring (thin). Routes map endpoints to controllers and attach middleware.
- `src/controllers/` = endpoint behavior (business logic). Controllers call Prisma and shape responses.
- `src/middleware/` = reusable request logic (auth/access checks, validation).
- `src/lib/` = shared utilities (e.g., a singleton Prisma client).
- `src/app.ts` = constructs the Express app (middleware + routes).
- `index.ts` = starts the server (port + listen).

This keeps each file small, makes new endpoints easy to add, and makes the app easier to test.

