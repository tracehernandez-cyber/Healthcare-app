# Roadmap — Healthcare App (Oncology Post-Op)

> **Product scope constraint:** This application is focused exclusively on **cancer clinics and oncology-related post-operative surgery workflows**. All seed data, demo data, frontend labels, pathway examples, and workflow names must use oncology / cancer-clinic examples. Do not use generic orthopedic, physical therapy, or general surgery examples (e.g. knee replacement, hip replacement, ACL repair) unless the user explicitly requests it.

---

## Phase 1 — Backend Cleanup

Stabilize the API surface before any frontend work begins.

### Checklist

- [ ] **Remove debug artifacts from `src/app.ts`**
  - Delete the `console.log("USERS ROUTER STACK", ...)` on line 28.
  - Remove (or gate behind `NODE_ENV !== "production"`) the `/__debug` route (lines 17-24).
  - Files: `src/app.ts`

- [ ] **Standardize response envelope**
  - Pick one shape (recommended: `{ success, data, error }`).
  - Update every controller to use the `ok()` / `fail()` helpers from `src/lib/http.ts` instead of raw `res.json()`.
  - Files: all files in `src/controllers/`, `src/lib/http.ts`

- [ ] **Fix Role enum mismatch**
  - `users.routes.ts` Zod schema accepts `"STAFF"` but Prisma defines `CLINICIAN`.
  - Change the Zod enum to `["PATIENT", "CLINICIAN", "ADMIN"]` to match `schema.prisma`.
  - Files: `src/routes/users.routes.ts`

- [ ] **Fix EnrollmentStatus enum mismatch**
  - `enrollments.routes.ts` Zod schema accepts `"CANCELLED"` but `schema.prisma` only has `ACTIVE | PAUSED | COMPLETED`.
  - Either remove `"CANCELLED"` from Zod or add `CANCELLED` to the Prisma enum via a new migration.
  - Files: `src/routes/enrollments.routes.ts`, possibly `prisma/schema.prisma`

- [ ] **Add CORS middleware**
  - Install `cors` package. Mount it in `src/app.ts` so a frontend dev server (e.g. Vite at `:5173`) can reach the API.
  - Files: `src/app.ts`, `package.json`

- [ ] **Add `tsconfig.json`**
  - Enables editor tooling and a future `tsc --noEmit` CI check.
  - Files: `tsconfig.json` (new)

- [ ] **Add `try/catch` to unprotected controllers**
  - `users.controller.ts`, `patients.controller.ts`, `enrollments.controller.ts` do not catch Prisma errors — an update on a nonexistent record crashes the process.
  - Files: `src/controllers/users.controller.ts`, `src/controllers/patients.controller.ts`, `src/controllers/enrollments.controller.ts`

- [ ] **Decide on `requireClinicAccess` middleware**
  - Currently unused. Either remove it or document it as a placeholder for future auth.
  - Files: `src/middleware/requireClinicAccess.ts`

### Acceptance Criteria

- `npm run dev` starts without console noise.
- Every endpoint returns `{ success, data, error }`.
- Sending `role: "STAFF"` or `status: "CANCELLED"` returns a 400, not a 500.
- A Vite dev server on `:5173` can `fetch("/api/clinics")` without CORS errors.
- `npx tsc --noEmit` passes.
- All existing tests still pass (`npm test`).

### Recommended Cursor Prompt

```
Implement Phase 1 (Backend Cleanup) from core-skeleton/ROADMAP.md.
Read the checklist items, fix each one, and run `npm test` after to
confirm nothing is broken. Follow the product scope constraint in
ROADMAP.md (oncology focus).
```

---

## Phase 2 — Seed Script

Provide realistic oncology demo data so the frontend is immediately useful after setup.

### Checklist

- [ ] **Create `prisma/seed.ts`**
  - Use Prisma Client to insert demo records in a transaction.
  - Files: `prisma/seed.ts` (new)

- [ ] **Register seed command in `package.json`**
  - Add `"prisma": { "seed": "tsx prisma/seed.ts" }` to `package.json`.
  - Files: `package.json`

- [ ] **Seed data to include (oncology-only examples)**

  | Entity | Count | Examples |
  |---|---|---|
  | Clinics | 2 | "Lakeside Oncology Center", "Westbrook Cancer Institute" |
  | Pathways | 8 | "Breast lumpectomy recovery", "Mastectomy recovery", "Colon cancer surgery recovery", "Prostatectomy recovery", "Port placement care", "Post-op symptom monitoring", "Drain care instructions", "Surgical wound care after oncology procedure" |
  | Users + Patients | 5-6 | Mix of ACTIVE / INVITED statuses, realistic names |
  | Enrollments | 5+ | Mix of ACTIVE / PAUSED / COMPLETED to demonstrate queue filtering |
  | Admin user | 1 | `admin@example.com`, role ADMIN (placeholder for future auth) |

- [ ] **Make seed idempotent**
  - Use `upsert` or check for existing records so re-running is safe.
  - Files: `prisma/seed.ts`

### Acceptance Criteria

- `npx prisma db seed` runs without errors on a fresh or existing database.
- Re-running the seed does not create duplicates.
- `GET /api/clinics` returns the seeded clinics.
- `GET /api/workflows/clinics/:id/queue` shows a populated queue.
- All pathway names are oncology-specific — no orthopedic/PT examples.

### Recommended Cursor Prompt

```
Implement Phase 2 (Seed Script) from core-skeleton/ROADMAP.md.
Create prisma/seed.ts with the oncology demo data described in the
checklist. Register it in package.json and verify with
`npx prisma db seed`. Follow the product scope constraint
(cancer clinics only).
```

---

## Phase 3 — Frontend Scaffold

Minimal React UI for a clinic admin to view the queue, onboard patients, and view patient detail.

### Checklist

- [ ] **Scaffold Vite + React project**
  - Create `client/` directory inside `core-skeleton/`.
  - Files: `client/` (new directory), `client/package.json`, `client/vite.config.ts`, `client/index.html`, `client/src/`

- [ ] **Configure dev proxy**
  - Vite dev server proxies `/api` and `/health` to `http://localhost:3000`.
  - Files: `client/vite.config.ts`

- [ ] **Build 3 MVP pages**

  | Page | Route | Data Source | Key UI |
  |---|---|---|---|
  | Clinic Dashboard | `/` | `GET /api/clinics` → select → `GET /api/workflows/clinics/:id/queue` | Clinic selector, active-enrollment table |
  | Onboard Patient | `/onboard` | Form → `POST /api/workflows/onboard` | Clinic + pathway dropdowns, patient form, success feedback |
  | Patient Detail | `/patients/:id` | `GET /api/workflows/patients/:id/dashboard` | Patient info card, enrollment list with status badges |

- [ ] **Add static serving for production**
  - Express serves `client/dist/` for non-API routes.
  - Files: `src/app.ts`

- [ ] **Styling**
  - Use Tailwind CSS or similar. Clean, healthcare-appropriate palette.
  - All labels, headers, and placeholder text should reference oncology workflows.
  - Files: `client/src/`, `client/tailwind.config.*`

### Acceptance Criteria

- `cd client && npm run dev` starts Vite on `:5173`; API calls proxy to `:3000`.
- Dashboard shows seeded clinics and queue.
- Onboard form creates a patient and shows confirmation.
- Patient detail page renders enrollment + pathway info.
- No orthopedic/generic labels — all oncology-themed.

### Recommended Cursor Prompt

```
Implement Phase 3 (Frontend Scaffold) from core-skeleton/ROADMAP.md.
Create a Vite + React app in client/ with the 3 MVP pages described.
Use Tailwind CSS. Proxy /api to localhost:3000. All labels and examples
must be oncology-specific per the product scope constraint.
```

---

## Phase 4 — Missing Tests

Backfill test coverage for all CRUD endpoints and edge cases.

### Checklist

- [ ] **PATCH endpoints**
  - `PATCH /api/clinics/:id` — update name, 404 for missing clinic
  - `PATCH /api/pathways/:id` — update name, 404 for missing pathway
  - `PATCH /api/enrollments/:id` — status transitions (ACTIVE → PAUSED → COMPLETED), invalid status rejected
  - `PATCH /api/users/:id` — update email/role/status, 404 for missing user
  - `PATCH /api/patients/:id` — update firstName/lastName/phone
  - Files: `tests/api.test.ts` (or split into per-resource test files)

- [ ] **GET single-resource endpoints**
  - `GET /api/clinics/:id` — found + 404
  - `GET /api/patients/:id` — found + 404
  - `GET /api/users/:id` — found + 404
  - `GET /api/enrollments/:id` — found + 404

- [ ] **List endpoints with filters**
  - `GET /api/users?clinicId=...`
  - `GET /api/patients?clinicId=...`
  - `GET /api/enrollments?patientId=...`
  - `GET /api/enrollments?clinicId=...`
  - `GET /api/pathways?clinicId=...`

- [ ] **Validation edge cases**
  - Missing required fields returns 400
  - Invalid email format returns 400
  - Empty PATCH body returns 400

- [ ] **Onboard workflow variant**
  - Onboard with `clinicName` (auto-creates clinic) instead of `clinicId`
  - Files: `tests/api.test.ts`

### Acceptance Criteria

- `npm test` passes with all new + existing tests.
- Every route defined in `src/routes/` has at least one happy-path and one error-path test.
- No test relies on data from a previous test run (use per-run unique IDs).

### Recommended Cursor Prompt

```
Implement Phase 4 (Missing Tests) from core-skeleton/ROADMAP.md.
Add tests for all PATCH, GET-by-id, list-with-filters, and validation
edge cases listed in the checklist. Run `npm test` to confirm all pass.
```

---

## Phase 5 — Deployment Prep

Make the app deployable as a single container.

### Checklist

- [ ] **Add `build` and `start` scripts**
  - `"build": "tsc"` → compiles to `dist/`.
  - `"start": "node dist/index.js"` → runs compiled output.
  - Files: `package.json`, `tsconfig.json`

- [ ] **Create `Dockerfile`**
  - Multi-stage: build stage (install + tsc + Vite build) → production stage (slim Node image).
  - Files: `Dockerfile` (new), `.dockerignore` (new)

- [ ] **Extend `/health` to check DB**
  - Run `SELECT 1` via Prisma or pg pool so load-balancer probes catch DB outages.
  - Files: `src/app.ts` or a new `src/routes/health.routes.ts`

- [ ] **Add structured logging**
  - Replace `console.log/error` with `pino` (or similar) for JSON log output.
  - Files: `src/lib/logger.ts` (new), all files using `console.*`

- [ ] **Add rate limiting**
  - Install `express-rate-limit`, apply to API routes.
  - Files: `src/app.ts`, `package.json`

- [x] ~~**Rename `Core Skeleton/` to `core-skeleton/`**~~ (done)

- [ ] **Document required environment variables**
  - Create `.env.example` listing `DATABASE_URL`, `PORT`, `NODE_ENV`.
  - Files: `.env.example` (new)

### Acceptance Criteria

- `npm run build` produces `dist/` with valid JS.
- `NODE_ENV=production npm start` serves API + static frontend.
- `docker build . && docker run -e DATABASE_URL=... -p 3000:3000` starts successfully.
- `/health` returns `{ ok: false }` when the DB is unreachable.
- No raw `console.log` calls remain in source (replaced by logger).

### Recommended Cursor Prompt

```
Implement Phase 5 (Deployment Prep) from core-skeleton/ROADMAP.md.
Add build/start scripts, Dockerfile, structured logging, rate limiting,
and an extended health check. Run `npm run build && npm start` to verify.
```
