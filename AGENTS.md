# AGENTS.md

## Cursor Cloud specific instructions

### Project Overview

This is a **Healthcare App** — a postoperative educational backend API built with Express v5 + TypeScript + Prisma + PostgreSQL. The project lives in the `Core Skeleton/` directory (note the space in the name — always quote this path).

### Services

| Service | How to run | Port |
|---|---|---|
| Express API (dev) | `cd "Core Skeleton" && npm run dev` | 3000 |
| PostgreSQL | `pg_ctlcluster 16 main start` | 5432 |

### Key gotchas

- **Directory name has a space**: The app lives in `Core Skeleton/`. Always quote paths: `cd "/workspace/Core Skeleton"`.
- **`zod` is a missing dependency**: The codebase imports `zod` but it is not listed in `package.json`. Run `npm install zod` after `npm install` until this is fixed upstream.
- **No `.env` file is committed**: You must create `Core Skeleton/.env` with at least `DATABASE_URL=postgresql://devuser:devpass@localhost:5432/healthcare_dev`.
- **PostgreSQL must be running** before starting the dev server or running migrations. Start it with `pg_ctlcluster 16 main start`.
- **Prisma migrations** must be applied before the API works: `npx prisma migrate dev --schema=prisma/schema.prisma` (from `Core Skeleton/`).
- **No lint, test, or build scripts** exist in `package.json`. There is no test framework configured.
- **No frontend** — this is an API-only backend at this stage.

### Standard commands (from `Core Skeleton/`)

- **Dev server**: `npm run dev` (uses `tsx watch`)
- **Prisma generate**: `npm run prisma:generate`
- **Prisma migrate**: `npm run prisma:migrate`
- **Health check**: `curl http://localhost:3000/health`

### API endpoints

See `Core Skeleton/README.md` for the full list. Key ones:
- `GET /health` — health check
- `POST /api/clinics` — create clinic
- `POST /api/pathways` — create pathway
- `POST /api/workflows/onboard` — onboard a patient (creates user + patient + enrollment in one transaction)
- `GET /api/workflows/patients/:id/dashboard` — patient dashboard
- `GET /api/workflows/clinics/:id/queue` — clinic queue
