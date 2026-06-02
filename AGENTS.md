# AGENTS.md

## Cursor Cloud specific instructions

### Before You Start

**Read `core-skeleton/ROADMAP.md` before making any changes.** It contains the phased implementation plan, product scope constraints, and acceptance criteria for each phase. All work should align with the current roadmap phase.

### Product Scope Constraint

This application is focused exclusively on **cancer clinics and oncology-related post-operative surgery workflows**. All seed data, demo data, frontend labels, pathway examples, and workflow names must use oncology / cancer-clinic examples only. Do not use generic orthopedic, physical therapy, or general surgery examples (e.g. knee replacement, hip replacement, ACL repair) unless the user explicitly requests it.

### Project Overview

This is a **Healthcare App** — a postoperative educational API and clinic admin UI for oncology clinics, built with Express v5 + TypeScript + Prisma + PostgreSQL + React (Vite). The project lives in the `core-skeleton/` directory.

### Services

| Service | How to run | Port |
|---|---|---|
| Express API (dev) | `cd core-skeleton && npm run dev` | 3000 |
| React client (dev) | `cd core-skeleton/client && npm run dev` | 5173 |
| PostgreSQL | `pg_ctlcluster 16 main start` | 5432 |

### Key gotchas

- **No `.env` file is committed**: You must create `core-skeleton/.env` with at least `DATABASE_URL=postgresql://devuser:devpass@localhost:5432/healthcare_dev`.
- **PostgreSQL must be running** before starting the dev server or running migrations. Start it with `pg_ctlcluster 16 main start`.
- **Prisma migrations** must be applied before the API works: `npx prisma migrate dev --schema=prisma/schema.prisma` (from `core-skeleton/`).
- **Seed data** (optional): `npx prisma db seed` from `core-skeleton/` after migrate.
- **No lint script** in root `package.json`. Tests: `npm test`; types: `npm run typecheck` (backend). Frontend build: `cd client && npm run build`.
- **Local UI dev** uses Vite on `:5173` with `/api` and `/health` proxied to `:3000`. Production build is served from `client/dist/` by Express for non-API routes.

### Standard commands (from `core-skeleton/`)

- **Dev server**: `npm run dev` (uses `tsx watch`)
- **Prisma generate**: `npm run prisma:generate`
- **Prisma migrate**: `npm run prisma:migrate`
- **Health check**: `curl http://localhost:3000/health`

### API endpoints

See `core-skeleton/README.md` for the full list. Key ones:
- `GET /health` — health check
- `POST /api/clinics` — create clinic
- `POST /api/pathways` — create pathway
- `POST /api/workflows/onboard` — onboard a patient (creates user + patient + enrollment in one transaction)
- `GET /api/workflows/patients/:id/dashboard` — patient dashboard
- `GET /api/workflows/clinics/:id/queue` — clinic queue
