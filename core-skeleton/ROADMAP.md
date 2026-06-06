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
COMPLETE
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
COMPLETE
---

## Phase 2.5 — API Contract Review

Document and verify the backend API contract before frontend work begins.

The goal of this phase is to make the React frontend easy to build by clearly defining every endpoint, request body, response body, error shape, and expected workflow. Do not add frontend code in this phase.

### Checklist

- [ ] **Create API contract documentation**
  - Create `docs/API_CONTRACT.md`.
  - Document every route currently defined in `src/routes/`.
  - Files: `docs/API_CONTRACT.md` (new)

- [ ] **Document standard response envelope**
  - Every endpoint should use the same shape:
    - Success: `{ success: true, data: ... , error: null }`
    - Failure: `{ success: false, data: null, error: { code, message, details? } }`
  - Note any endpoint that does not currently follow this pattern.
  - Files: `docs/API_CONTRACT.md`

- [ ] **Document core resource endpoints**
  - Clinics
  - Pathways
  - Users
  - Patients
  - Enrollments
  - Workflow routes
  - Health route
  - Include method, path, purpose, request body, response body, and common errors.
  - Files: `docs/API_CONTRACT.md`

- [ ] **Document frontend-facing workflows**
  - Clinic dashboard flow:
    - `GET /api/clinics`
    - select clinic
    - `GET /api/workflows/clinics/:id/queue`
  - Onboard patient flow:
    - get clinics/pathways
    - submit `POST /api/workflows/onboard`
    - confirm enrollment created
  - Patient detail flow:
    - `GET /api/workflows/patients/:id/dashboard`
  - Files: `docs/API_CONTRACT.md`

- [ ] **Add example requests and responses**
  - Use oncology-only examples from the seed data.
  - Include at least one success and one error example for each major resource type.
  - Avoid orthopedic, physical therapy, or general surgery examples.
  - Files: `docs/API_CONTRACT.md`

- [ ] **Create manual API smoke-test script**
  - Create `scripts/smoke-test-api.sh`.
  - Script should check:
    - `/health`
    - `GET /api/clinics`
    - one clinic queue endpoint
    - one patient dashboard endpoint if seeded data exists
  - Files: `scripts/smoke-test-api.sh` (new)

- [ ] **Add smoke-test command to `package.json`**
  - Recommended script:
    - `"smoke:api": "bash scripts/smoke-test-api.sh"`
  - Files: `package.json`

- [ ] **Identify frontend blockers**
  - Add a section in `docs/API_CONTRACT.md` called `Frontend Blockers / Notes`.
  - List anything that may affect Phase 3, such as missing endpoints, inconsistent response shapes, unclear IDs, missing filters, or missing seeded data.
  - Files: `docs/API_CONTRACT.md`

### Acceptance Criteria

- `docs/API_CONTRACT.md` exists and documents every route in `src/routes/`.
- Every documented endpoint includes method, path, purpose, request body if applicable, response body, and common errors.
- All examples are oncology-specific.
- The documented response shape matches the actual API behavior after Phase 1.
- `npm run smoke:api` runs against the local dev server and verifies the basic seeded workflow.
- Any missing or inconsistent backend behavior needed for the frontend is listed under `Frontend Blockers / Notes`.
- No React/Vite/frontend code is added in this phase.

### Recommended Cursor Prompt

COMPLETE
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
COMPLETE
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

## Phase 5 — Care Pathways Engine

Create reusable oncology care pathway templates and patient-specific pathway enrollments.

This phase turns the app from a basic clinic/patient demo into a real care workflow system. Do not add authentication, real notifications, or external messaging integrations in this phase. Focus only on the pathway data model, enrollment logic, and progress tracking.

### Checklist

* [ ] **Add pathway template models**

  * Create `PathwayTemplate`
  * Create `PathwayStepTemplate`
  * Support oncology-specific pathway templates such as:

    * "Mastectomy recovery"
    * "Breast lumpectomy recovery"
    * "Colon cancer surgery recovery"
    * "Prostatectomy recovery"
    * "Port placement care"
    * "Drain care monitoring"
    * "Surgical wound care after oncology procedure"
  * Files: `prisma/schema.prisma`

* [ ] **Add patient pathway enrollment models**

  * Create `PatientPathwayEnrollment`
  * Create `PatientPathwayStep`
  * Enrollment should link:

    * clinic
    * patient
    * pathway template
    * pathway steps
    * status
    * start date
    * optional completed date
  * Files: `prisma/schema.prisma`

* [ ] **Add enums for pathway status**

  * Suggested enrollment statuses:

    * `ACTIVE`
    * `PAUSED`
    * `COMPLETED`
    * `CANCELLED`
  * Suggested step statuses:

    * `PENDING`
    * `ACTIVE`
    * `COMPLETED`
    * `SKIPPED`
    * `FAILED`
  * Files: `prisma/schema.prisma`

* [ ] **Seed pathway templates and steps**

  * Add at least 2 complete oncology pathway templates.
  * Example:

    * "Mastectomy recovery"

      * Day 0: Surgery completed
      * Day 1: Pain and nausea check-in
      * Day 3: Drain output check
      * Day 7: Wound care check
      * Day 14: Follow-up appointment reminder
    * "Port placement care"

      * Day 0: Port placement completed
      * Day 1: Pain/redness check
      * Day 3: Infection symptom check
      * Day 7: Dressing/site check
  * Files: `prisma/seed.ts`

* [ ] **Create pathway template routes**

  * `GET /api/pathway-templates`

    * List pathway templates
    * Optional filters:

      * `clinicId`
      * `isActive`
  * `GET /api/pathway-templates/:id`

    * Get one pathway template with step templates
  * `POST /api/pathway-templates`

    * Create a pathway template
  * `PATCH /api/pathway-templates/:id`

    * Update name, description, active status
  * Files:

    * `src/routes/pathwayTemplates.routes.ts`
    * `src/controllers/pathwayTemplates.controller.ts`

* [ ] **Create pathway step template routes**

  * `GET /api/pathway-templates/:templateId/steps`

    * List step templates for a pathway
  * `POST /api/pathway-templates/:templateId/steps`

    * Add a step template
  * `PATCH /api/pathway-step-templates/:id`

    * Update step title, description, day offset, sort order, or active status
  * Files:

    * `src/routes/pathwayStepTemplates.routes.ts`
    * `src/controllers/pathwayStepTemplates.controller.ts`

* [ ] **Create patient pathway enrollment routes**

  * `GET /api/pathway-enrollments`

    * List enrollments
    * Optional filters:

      * `clinicId`
      * `patientId`
      * `pathwayTemplateId`
      * `status`
  * `GET /api/pathway-enrollments/:id`

    * Get one enrollment with patient, pathway template, and patient steps
  * `POST /api/pathway-enrollments`

    * Enroll a patient into a pathway template
    * Creates patient-specific pathway steps from the selected template
  * `PATCH /api/pathway-enrollments/:id`

    * Update enrollment status
  * Files:

    * `src/routes/pathwayEnrollments.routes.ts`
    * `src/controllers/pathwayEnrollments.controller.ts`

* [ ] **Create patient pathway step routes**

  * `GET /api/pathway-enrollments/:enrollmentId/steps`

    * List all patient-specific pathway steps for an enrollment
  * `PATCH /api/patient-pathway-steps/:id`

    * Update step status
    * Optionally set completed date
    * Optionally add clinician note
  * Files:

    * `src/routes/patientPathwaySteps.routes.ts`
    * `src/controllers/patientPathwaySteps.controller.ts`

* [ ] **Add patient-specific pathway convenience route**

  * `GET /api/patients/:patientId/pathway-enrollments`

    * List a patient’s pathway enrollments
  * Files:

    * `src/routes/patients.routes.ts`
    * `src/controllers/patients.controller.ts`

* [ ] **Add Zod validation**

  * Validate all create and patch bodies.
  * Reject empty PATCH bodies.
  * Validate enum values.
  * Files:

    * `src/routes/*.routes.ts`
    * or `src/schemas/*.ts` if schemas are split out

* [ ] **Add backend tests**

  * `GET /api/pathway-templates`
  * `GET /api/pathway-templates/:id`
  * `POST /api/pathway-enrollments`
  * `GET /api/pathway-enrollments/:id`
  * `GET /api/patients/:patientId/pathway-enrollments`
  * `GET /api/pathway-enrollments/:enrollmentId/steps`
  * `PATCH /api/patient-pathway-steps/:id`
  * Invalid template ID returns 404
  * Invalid patient ID returns 404
  * Invalid status returns 400
  * Files: `tests/api.test.ts` or split test files

### Acceptance Criteria

* `npx prisma migrate dev` creates the new pathway tables.
* `npx prisma db seed` creates oncology-specific pathway templates and step templates.
* A patient can be enrolled into a pathway using `POST /api/pathway-enrollments`.
* Enrolling a patient creates patient-specific pathway steps.
* A patient’s pathway progress can be retrieved.
* A pathway step can be marked completed, skipped, or failed.
* All pathway APIs return the standard `{ success, data, error }` envelope.
* All examples and seed data are oncology-specific.
* `npm test` passes.
* `npm run typecheck` passes.

### Recommended Cursor Prompt

```txt
Implement Phase 5 (Care Pathways Engine) from core-skeleton/ROADMAP.md.

Use resource-style endpoints, not workflow-style endpoints, for the new pathway system.

Add Prisma models for PathwayTemplate, PathwayStepTemplate, PatientPathwayEnrollment, and PatientPathwayStep. Add appropriate enums for enrollment status and step status. Add oncology-specific seed data with at least two complete pathway templates and multiple steps per template.

Create routes/controllers for:
- GET /api/pathway-templates
- GET /api/pathway-templates/:id
- POST /api/pathway-templates
- PATCH /api/pathway-templates/:id
- GET /api/pathway-templates/:templateId/steps
- POST /api/pathway-templates/:templateId/steps
- PATCH /api/pathway-step-templates/:id
- GET /api/pathway-enrollments
- GET /api/pathway-enrollments/:id
- POST /api/pathway-enrollments
- PATCH /api/pathway-enrollments/:id
- GET /api/pathway-enrollments/:enrollmentId/steps
- PATCH /api/patient-pathway-steps/:id
- GET /api/patients/:patientId/pathway-enrollments

Preserve the existing API response envelope. Add Zod validation. Add backend tests for happy paths and error paths. Do not add auth or notification sending yet. Keep all examples oncology-specific.

Run:
- npx prisma migrate dev
- npx prisma db seed
- npm test
- npm run typecheck
```

---

## Phase 6 — Notifications Framework

Create internal notification records tied to patients, pathway enrollments, and pathway steps.

This phase does not send real emails or text messages yet. It only creates the internal notification infrastructure so the app can decide what should be sent and track notification status.

### Checklist

* [ ] **Add notification models**

  * Create `Notification`
  * Optional: create `NotificationTemplate` if helpful
  * Notification should link to:

    * clinic
    * patient
    * optional pathway enrollment
    * optional patient pathway step
  * Files: `prisma/schema.prisma`

* [ ] **Add notification enums**

  * Suggested `NotificationChannel`:

    * `EMAIL`
    * `SMS`
  * Suggested `NotificationStatus`:

    * `QUEUED`
    * `SENT`
    * `FAILED`
    * `OPENED`
    * `RESPONDED`
    * `CANCELLED`
  * Suggested `NotificationType`:

    * `CHECK_IN`
    * `REMINDER`
    * `FOLLOW_UP`
    * `INSTRUCTION`
  * Files: `prisma/schema.prisma`

* [ ] **Add notification fields**

  * `recipientEmail`
  * `recipientPhone`
  * `subject`
  * `body`
  * `channel`
  * `type`
  * `status`
  * `scheduledFor`
  * `sentAt`
  * `failedAt`
  * `failureReason`
  * Files: `prisma/schema.prisma`

* [ ] **Create notification records from pathway enrollment**

  * When a patient is enrolled into a pathway, create queued notification records for steps that require outreach.
  * Keep this simple:

    * email channel first
    * SMS structurally supported but not sent
    * no SendGrid/Twilio yet
  * Files:

    * `src/controllers/pathwayEnrollments.controller.ts`
    * or `src/services/notifications.service.ts`

* [ ] **Create notification service**

  * Add helper function:

    * `createNotificationsForEnrollment(enrollmentId)`
  * Optional helper functions:

    * `queueNotification(...)`
    * `markNotificationSent(...)`
    * `markNotificationFailed(...)`
  * Files:

    * `src/services/notifications.service.ts`

* [ ] **Create notification routes**

  * `GET /api/notifications`

    * List notifications
    * Optional filters:

      * `clinicId`
      * `patientId`
      * `pathwayEnrollmentId`
      * `status`
      * `channel`
  * `GET /api/notifications/:id`

    * Get one notification
  * `POST /api/notifications`

    * Manually create a queued notification
  * `PATCH /api/notifications/:id`

    * Update notification status or metadata
  * Files:

    * `src/routes/notifications.routes.ts`
    * `src/controllers/notifications.controller.ts`

* [ ] **Create patient notification route**

  * `GET /api/patients/:patientId/notifications`

    * List notification history for a patient
  * Files:

    * `src/routes/patients.routes.ts`
    * `src/controllers/patients.controller.ts`

* [ ] **Create enrollment notification route**

  * `GET /api/pathway-enrollments/:enrollmentId/notifications`

    * List notification history for a pathway enrollment
  * Files:

    * `src/routes/pathwayEnrollments.routes.ts`
    * `src/controllers/pathwayEnrollments.controller.ts`

* [ ] **Add seed notification examples**

  * Add a few queued/sent/failed notification records connected to oncology pathway enrollments.
  * Files: `prisma/seed.ts`

* [ ] **Add backend tests**

  * `GET /api/notifications`
  * `GET /api/notifications/:id`
  * `POST /api/notifications`
  * `PATCH /api/notifications/:id`
  * `GET /api/patients/:patientId/notifications`
  * `GET /api/pathway-enrollments/:enrollmentId/notifications`
  * Enrolling a patient creates queued notification records
  * Invalid notification status returns 400
  * Missing patient returns 404
  * Files: `tests/api.test.ts` or split test files

### Acceptance Criteria

* Notification tables are created through Prisma migration.
* Pathway enrollment can create queued notification records.
* Notification records can be listed by clinic, patient, enrollment, status, and channel.
* Notification records include subject/body/channel/status.
* Email is the primary channel.
* SMS exists only as schema support for future work.
* No real external provider is called.
* All notification APIs return the standard `{ success, data, error }` envelope.
* `npm test` passes.
* `npm run typecheck` passes.

### Recommended Cursor Prompt

```txt
Implement Phase 6 (Notifications Framework) from core-skeleton/ROADMAP.md.

Add internal notification infrastructure only. Do not integrate SendGrid, Twilio, or any external provider yet.

Add Prisma models/enums for Notification and optional NotificationTemplate. Notifications should support EMAIL and SMS channels, but only create internal records for now. Notifications should link to clinic, patient, optional pathway enrollment, and optional patient pathway step.

Create a notifications service that can create queued notification records when a patient is enrolled into a pathway.

Create routes/controllers for:
- GET /api/notifications
- GET /api/notifications/:id
- POST /api/notifications
- PATCH /api/notifications/:id
- GET /api/patients/:patientId/notifications
- GET /api/pathway-enrollments/:enrollmentId/notifications

Add seed notification examples using oncology-specific patients and pathways. Add backend tests for notification creation, listing, filtering, status updates, and automatic notification creation during pathway enrollment.

Preserve the standard API response envelope. Keep all examples oncology-specific.

Run:
- npx prisma migrate dev
- npx prisma db seed
- npm test
- npm run typecheck
```

---

## Phase 7 — Authentication and Multi-Tenant Security

Add clinician/admin accounts, login, roles, clinic membership, and clinic-scoped authorization.

This phase makes the app multi-tenant. Users should only access data for clinics they belong to. Do not add a polished frontend portal yet; focus on backend auth and authorization.

### Checklist

* [ ] **Review existing user model**

  * If a `User` model already exists, update it instead of creating a duplicate.
  * Confirm it supports:

    * email
    * name
    * role
    * status
    * password hash
  * Files: `prisma/schema.prisma`

* [ ] **Add or update role enum**

  * Suggested roles:

    * `ADMIN`
    * `CLINICIAN`
    * `STAFF`
  * Avoid using `PATIENT` for clinician portal users unless the current schema requires it.
  * Files: `prisma/schema.prisma`

* [ ] **Add clinic membership model**

  * Create `ClinicMembership` if not already present.
  * Should link:

    * user
    * clinic
    * role within clinic
    * active/inactive status
  * This supports users belonging to multiple clinics.
  * Files: `prisma/schema.prisma`

* [ ] **Add password hashing**

  * Install `bcryptjs` or similar.
  * Store only `passwordHash`.
  * Never store plaintext passwords.
  * Files:

    * `package.json`
    * `src/services/auth.service.ts`

* [ ] **Add JWT/session auth**

  * Install `jsonwebtoken` or similar.
  * Add `JWT_SECRET` to `.env.example`.
  * Add token generation and verification helpers.
  * Files:

    * `src/services/auth.service.ts`
    * `.env.example`

* [ ] **Create auth routes**

  * `POST /api/auth/login`

    * Body: email + password
    * Response: token + user profile + clinic memberships
  * `GET /api/auth/me`

    * Returns authenticated user profile and clinic memberships
  * `POST /api/auth/logout`

    * Optional no-op for JWT-based auth
  * Files:

    * `src/routes/auth.routes.ts`
    * `src/controllers/auth.controller.ts`

* [ ] **Create auth middleware**

  * `requireAuth`

    * verifies token
    * attaches user to request
  * Files:

    * `src/middleware/requireAuth.ts`
    * possible shared Express request type file

* [ ] **Create clinic access middleware/helper**

  * `requireClinicAccess`

    * verifies authenticated user belongs to requested clinic
  * Also add service/helper functions:

    * `assertUserCanAccessClinic(userId, clinicId)`
    * `assertUserCanAccessPatient(userId, patientId)`
    * `assertUserCanAccessEnrollment(userId, enrollmentId)`
    * `assertUserCanAccessNotification(userId, notificationId)`
  * Files:

    * `src/middleware/requireClinicAccess.ts`
    * `src/services/accessControl.service.ts`

* [ ] **Protect resource routes**

  * Protect:

    * patients
    * pathway enrollments
    * patient pathway steps
    * notifications
    * clinic dashboard/resource routes
  * Do not expose cross-clinic records.
  * Files:

    * `src/app.ts`
    * `src/routes/*.routes.ts`
    * `src/controllers/*.controller.ts`

* [ ] **Add clinic-scoped filtering**

  * `GET /api/patients`

    * If user is not global admin, return only patients in user’s clinics.
  * `GET /api/pathway-enrollments`

    * Return only enrollments in user’s clinics.
  * `GET /api/notifications`

    * Return only notifications in user’s clinics.
  * Files:

    * related controllers/services

* [ ] **Update seed data**

  * Add demo users:

    * `admin@example.com`
    * `clinician.lakeside@example.com`
    * `clinician.westbrook@example.com`
  * Add clinic memberships.
  * Use a known demo password only for local development.
  * Files: `prisma/seed.ts`

* [ ] **Add auth tests**

  * Login succeeds with valid credentials.
  * Login fails with invalid password.
  * `/api/auth/me` requires a valid token.
  * Authenticated clinician can access assigned clinic data.
  * Authenticated clinician cannot access another clinic’s patients.
  * Authenticated clinician cannot access another clinic’s pathway enrollments.
  * Authenticated clinician cannot access another clinic’s notifications.
  * Files: `tests/api.test.ts` or split test files

### Acceptance Criteria

* Users can log in using `POST /api/auth/login`.
* Authenticated users can fetch `/api/auth/me`.
* Passwords are hashed.
* JWT secret is documented in `.env.example`.
* Clinic membership controls access.
* Cross-clinic access returns 403 or 404 consistently.
* Patient, enrollment, pathway step, and notification routes are protected.
* Existing tests are updated to authenticate where needed.
* `npm test` passes.
* `npm run typecheck` passes.

### Recommended Cursor Prompt

```txt
Implement Phase 7 (Authentication and Multi-Tenant Security) from core-skeleton/ROADMAP.md.

Add backend authentication and clinic-scoped authorization. Use resource-style API patterns.

Review the existing User model before changing schema. Add or update User, ClinicMembership, role enums, passwordHash support, and JWT authentication. Use bcryptjs for password hashing and jsonwebtoken or an equivalent library for JWTs.

Create routes/controllers for:
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout

Create middleware/services:
- requireAuth
- requireClinicAccess
- accessControl.service.ts helpers for clinic, patient, enrollment, notification, and pathway step access

Protect patient, pathway enrollment, pathway step, and notification routes. Make sure users only see data for clinics they belong to.

Update seed data with admin and clinician demo users for Lakeside Oncology Center and Westbrook Cancer Institute. Use a local-development demo password only.

Add tests for login, /me, protected routes, and cross-clinic access prevention.

Preserve the standard API response envelope. Keep all examples oncology-specific.

Run:
- npx prisma migrate dev
- npx prisma db seed
- npm test
- npm run typecheck
```

---

## Phase 8 — Clinician Portal

Build the first usable clinician-facing portal around the secured backend.

This phase should make the demo feel like a real product: a clinician logs in, sees their clinic data, views patients, enrolls a patient into a pathway, and reviews pathway progress and notification history.

### Checklist

* [ ] **Add frontend auth client**

  * Add login API call.
  * Store token/session.
  * Attach token to API requests.
  * Handle expired/invalid token.
  * Files:

    * `client/src/api/client.ts`
    * `client/src/api/auth.ts`
    * `client/src/types.ts`

* [ ] **Add login page**

  * Route: `/login`
  * Fields:

    * email
    * password
  * On success:

    * store token
    * load user profile
    * redirect to dashboard
  * Files:

    * `client/src/pages/LoginPage.tsx`

* [ ] **Add authenticated app layout**

  * Header/nav
  * Logged-in user display
  * Current clinic display
  * Logout button
  * Protected route handling
  * Files:

    * `client/src/components/AppLayout.tsx`
    * `client/src/components/ProtectedRoute.tsx`

* [ ] **Add clinic dashboard**

  * Route: `/dashboard`
  * Data:

    * `GET /api/auth/me`
    * `GET /api/patients`
    * `GET /api/pathway-enrollments`
    * `GET /api/notifications`
  * Show:

    * active patients
    * active pathway enrollments
    * queued/failed notifications
    * recent pathway activity
  * Files:

    * `client/src/pages/DashboardPage.tsx`

* [ ] **Add patient list page**

  * Route: `/patients`
  * Data:

    * `GET /api/patients`
  * Show:

    * patient name
    * clinic
    * status
    * active pathway count
    * link to detail page
  * Files:

    * `client/src/pages/PatientsPage.tsx`

* [ ] **Add patient detail page**

  * Route: `/patients/:id`
  * Data:

    * `GET /api/patients/:id`
    * `GET /api/patients/:id/pathway-enrollments`
    * `GET /api/patients/:id/notifications`
  * Show:

    * patient profile
    * pathway enrollments
    * pathway progress
    * notification history
  * Files:

    * `client/src/pages/PatientDetailPage.tsx`

* [ ] **Add pathway enrollment UI**

  * Component:

    * pathway template selector
    * start date
    * submit button
  * API:

    * `GET /api/pathway-templates`
    * `POST /api/pathway-enrollments`
  * Files:

    * `client/src/components/EnrollPatientInPathwayForm.tsx`

* [ ] **Add pathway progress UI**

  * Component:

    * step list
    * status badges
    * update step status action
  * API:

    * `GET /api/pathway-enrollments/:id`
    * `GET /api/pathway-enrollments/:id/steps`
    * `PATCH /api/patient-pathway-steps/:id`
  * Files:

    * `client/src/components/PathwayProgress.tsx`

* [ ] **Add notification history UI**

  * Component:

    * notification list
    * channel badge
    * status badge
    * scheduled/sent timestamps
  * API:

    * `GET /api/patients/:id/notifications`
    * `GET /api/pathway-enrollments/:id/notifications`
  * Files:

    * `client/src/components/NotificationHistory.tsx`

* [ ] **Add frontend loading/error/empty states**

  * Empty patient list
  * No active pathway enrollment
  * No notifications yet
  * Failed API request
  * Unauthorized/expired session
  * Files:

    * `client/src/components/*`
    * `client/src/pages/*`

* [ ] **Update old scaffold routes if needed**

  * Replace or redirect older demo routes:

    * `/`
    * `/onboard`
    * `/patients/:id`
  * Make `/` redirect to `/dashboard` when logged in.
  * Files:

    * `client/src/App.tsx`

* [ ] **Verify frontend build**

  * Run:

    * `cd client && npm run build`
  * Files:

    * frontend files only

### Acceptance Criteria

* Clinician can log in from `/login`.
* Clinician is redirected to dashboard after login.
* API requests include auth token.
* Clinician only sees assigned clinic data.
* Clinician can view patient list.
* Clinician can open patient detail page.
* Clinician can enroll patient into oncology pathway.
* Clinician can view pathway progress.
* Clinician can update pathway step status.
* Clinician can view notification history.
* Frontend handles loading, empty, and error states.
* No orthopedic/generic labels are introduced.
* `cd client && npm run build` passes.
* Backend tests still pass.

### Recommended Cursor Prompt

```txt
Implement Phase 8 (Clinician Portal) from core-skeleton/ROADMAP.md.

Build the first usable clinician-facing frontend on top of the secured backend from Phase 7.

Use the existing Vite + React frontend. Add login, authenticated layout, dashboard, patient list, patient detail, pathway enrollment UI, pathway progress UI, and notification history UI.

Use these resource-style APIs:
- POST /api/auth/login
- GET /api/auth/me
- GET /api/patients
- GET /api/patients/:id
- GET /api/patients/:id/pathway-enrollments
- GET /api/patients/:id/notifications
- GET /api/pathway-templates
- POST /api/pathway-enrollments
- GET /api/pathway-enrollments/:id
- GET /api/pathway-enrollments/:id/steps
- PATCH /api/patient-pathway-steps/:id
- GET /api/pathway-enrollments/:id/notifications

Store the auth token on the frontend and attach it to API requests. Add protected route handling. Keep UI simple, clean, and demo-ready. All labels and examples must be oncology-specific.

Run:
- cd client && npm run build
- npm test
- npm run typecheck
```

---

## Phase 9 — Audit Logging and Security Review

Add basic auditability and verify clinic isolation across the product workflow.

This phase prepares the app for real-world healthcare expectations. It does not make the app fully HIPAA-compliant yet, but it creates the foundation for tracking sensitive actions.

### Checklist

* [ ] **Add audit log model**

  * Create `AuditLog`
  * Suggested fields:

    * `id`
    * `clinicId`
    * `userId`
    * `action`
    * `resourceType`
    * `resourceId`
    * `metadata`
    * `createdAt`
  * Files: `prisma/schema.prisma`

* [ ] **Add audit action enum or constants**

  * Suggested actions:

    * `PATIENT_CREATED`
    * `PATIENT_UPDATED`
    * `PATHWAY_ENROLLED`
    * `PATHWAY_ENROLLMENT_UPDATED`
    * `PATHWAY_STEP_UPDATED`
    * `NOTIFICATION_CREATED`
    * `NOTIFICATION_UPDATED`
    * `USER_LOGIN`
    * `USER_LOGIN_FAILED`
  * Files:

    * `src/services/audit.service.ts`
    * optional constants file

* [ ] **Create audit service**

  * Add helper:

    * `createAuditLog(...)`
  * Should never crash the main request if audit logging fails.
  * Files:

    * `src/services/audit.service.ts`

* [ ] **Log patient actions**

  * Patient created
  * Patient updated
  * Files:

    * `src/controllers/patients.controller.ts`

* [ ] **Log pathway actions**

  * Pathway enrollment created
  * Enrollment status updated
  * Patient pathway step status updated
  * Files:

    * `src/controllers/pathwayEnrollments.controller.ts`
    * `src/controllers/patientPathwaySteps.controller.ts`

* [ ] **Log notification actions**

  * Notification created
  * Notification status updated
  * Files:

    * `src/controllers/notifications.controller.ts`
    * `src/services/notifications.service.ts`

* [ ] **Log auth actions**

  * Successful login
  * Failed login
  * Files:

    * `src/controllers/auth.controller.ts`
    * `src/services/auth.service.ts`

* [ ] **Create audit routes**

  * `GET /api/audit-logs`

    * List audit logs
    * Optional filters:

      * `clinicId`
      * `userId`
      * `resourceType`
      * `resourceId`
      * `action`
  * `GET /api/audit-logs/:id`

    * Get one audit log
  * These routes should require auth.
  * Files:

    * `src/routes/auditLogs.routes.ts`
    * `src/controllers/auditLogs.controller.ts`

* [ ] **Restrict audit log visibility**

  * Clinic users only see audit logs for clinics they belong to.
  * Admin can view all logs if global admin behavior exists.
  * Files:

    * `src/controllers/auditLogs.controller.ts`
    * `src/services/accessControl.service.ts`

* [ ] **Add cross-clinic security tests**

  * Clinician A cannot access:

    * other clinic patient
    * other clinic pathway enrollment
    * other clinic pathway step
    * other clinic notification
    * other clinic audit log
  * Files:

    * `tests/security.test.ts`
    * or `tests/api.test.ts`

* [ ] **Add security documentation**

  * Create `docs/SECURITY_NOTES.md`
  * Include:

    * current auth approach
    * clinic isolation approach
    * known limitations
    * future HIPAA considerations
    * PHI handling notes
    * audit logging behavior
  * Files:

    * `docs/SECURITY_NOTES.md`

### Acceptance Criteria

* Key actions create audit log records.
* Audit logging failure does not crash primary workflows.
* Audit logs include user, clinic, action, resource type, resource ID, and timestamp.
* Audit log routes are protected.
* Users cannot view audit logs for clinics they do not belong to.
* Cross-clinic access tests exist for patients, enrollments, steps, notifications, and audit logs.
* `docs/SECURITY_NOTES.md` documents current security assumptions and future HIPAA considerations.
* `npm test` passes.
* `npm run typecheck` passes.

### Recommended Cursor Prompt

```txt
Implement Phase 9 (Audit Logging and Security Review) from core-skeleton/ROADMAP.md.

Add AuditLog schema, audit logging service, audit routes, and cross-clinic security tests.

Create audit records for:
- patient created/updated
- pathway enrollment created/updated
- patient pathway step updated
- notification created/updated
- successful login
- failed login

Create routes/controllers for:
- GET /api/audit-logs
- GET /api/audit-logs/:id

Audit routes must require auth and enforce clinic-scoped access. Users should only see audit logs for clinics they belong to unless a global admin pattern already exists.

Add tests proving cross-clinic access is blocked for patients, pathway enrollments, pathway steps, notifications, and audit logs.

Create docs/SECURITY_NOTES.md with current security assumptions, known limitations, audit behavior, and future HIPAA considerations.

Preserve the standard API response envelope. Keep all examples oncology-specific.

Run:
- npx prisma migrate dev
- npm test
- npm run typecheck
```

---

## Phase 10 — Deployment Prep

Make the app deployable as a single container.

This phase moves the app from local development toward production-style deployment. It should happen after the core product workflow, auth, clinic isolation, and audit logging are in place.

### Checklist

* [ ] **Add root build and start scripts**

  * Backend build:

    * `"build": "tsc"`
  * Backend start:

    * `"start": "node dist/index.js"`
  * If frontend lives in `client/`, add root scripts such as:

    * `"build:client": "npm --prefix client run build"`
    * `"build:all": "npm run build:client && npm run build"`
  * Files:

    * `package.json`
    * `client/package.json`
    * `tsconfig.json`

* [ ] **Verify Express serves frontend build**

  * Express should serve `client/dist/` in production.
  * Non-API routes should return `index.html`.
  * API routes should remain under `/api`.
  * Files:

    * `src/app.ts`

* [ ] **Create production Dockerfile**

  * Multi-stage Dockerfile:

    * install backend dependencies
    * install frontend dependencies
    * build frontend
    * build backend
    * run compiled backend
  * Files:

    * `Dockerfile`
    * `.dockerignore`

* [ ] **Add `.dockerignore`**

  * Exclude:

    * `node_modules`
    * `client/node_modules`
    * `.env`
    * `.git`
    * test artifacts
    * local logs
  * Files:

    * `.dockerignore`

* [ ] **Document environment variables**

  * Create/update `.env.example`
  * Include:

    * `DATABASE_URL`
    * `PORT`
    * `NODE_ENV`
    * `JWT_SECRET`
    * optional future `SENDGRID_API_KEY`
    * optional future `TWILIO_ACCOUNT_SID`
    * optional future `TWILIO_AUTH_TOKEN`
  * Files:

    * `.env.example`

* [ ] **Extend health check**

  * `GET /health`

    * returns app status
    * checks database connectivity using Prisma
    * includes safe metadata only
  * Example response:

    * healthy DB: `{ success: true, data: { ok: true, db: true }, error: null }`
    * DB down: `{ success: false, data: null, error: { message: "Database unavailable" } }`
  * Files:

    * `src/app.ts`
    * or `src/routes/health.routes.ts`

* [ ] **Add structured logging**

  * Install `pino` or similar.
  * Create logger helper.
  * Replace raw `console.log`/`console.error` in source.
  * Files:

    * `src/lib/logger.ts`
    * any file using `console.*`

* [ ] **Add request logging**

  * Log method, path, status, and request duration.
  * Do not log PHI or sensitive request bodies.
  * Files:

    * `src/middleware/requestLogger.ts`
    * `src/app.ts`

* [ ] **Add rate limiting**

  * Install `express-rate-limit`.
  * Apply general API rate limit.
  * Apply stricter auth route rate limit for login.
  * Files:

    * `src/app.ts`
    * `src/routes/auth.routes.ts`
    * `package.json`

* [ ] **Add production-safe error handling**

  * Ensure unhandled errors return standard envelope.
  * Do not leak stack traces in production.
  * Files:

    * `src/middleware/errorHandler.ts`
    * `src/app.ts`

* [ ] **Add deployment documentation**

  * Create `docs/DEPLOYMENT.md`
  * Include:

    * local production build steps
    * Docker build/run commands
    * required environment variables
    * database migration strategy
    * seed strategy for demo vs production
    * Render/Railway/Fly.io notes
  * Files:

    * `docs/DEPLOYMENT.md`

### Acceptance Criteria

* `npm run build:all` or equivalent builds backend and frontend.
* `NODE_ENV=production npm start` serves API and frontend.
* `docker build .` succeeds.
* Docker container starts with `DATABASE_URL`, `JWT_SECRET`, and `PORT`.
* `/health` reports database connectivity.
* No raw `console.log` calls remain in source.
* Request logs do not expose PHI.
* Login route has stricter rate limiting.
* `.env.example` is complete.
* `docs/DEPLOYMENT.md` exists.
* `npm test` passes.
* `npm run typecheck` passes.
* `cd client && npm run build` passes.

### Recommended Cursor Prompt

```txt
Implement Phase 10 (Deployment Prep) from core-skeleton/ROADMAP.md.

Make the app deployable as a single container after the core product workflow is complete.

Add build/start scripts for backend and frontend, confirm Express serves client/dist in production, create a multi-stage Dockerfile and .dockerignore, extend /health to check database connectivity, add structured logging, request logging, rate limiting, production-safe error handling, and deployment documentation.

Do not log PHI or sensitive request bodies. Keep all API errors in the standard response envelope.

Create/update:
- Dockerfile
- .dockerignore
- .env.example
- docs/DEPLOYMENT.md
- src/lib/logger.ts
- src/middleware/requestLogger.ts
- src/middleware/errorHandler.ts

Run:
- npm test
- npm run typecheck
- cd client && npm run build
- npm run build
- docker build .
```

---

New Phase 11 — Patient Experience Platform
Goal

Create a patient-facing experience that allows oncology patients to receive notifications, complete pathway tasks, submit check-ins, and communicate with their care team.

The patient experience should support both:

Mobile-responsive web portal
Future native mobile applications

This phase introduces in-app notifications and push notification support but does not yet require SendGrid or Twilio.

Checklist
Patient Accounts
 Create PatientUser authentication strategy
 Decide whether patients share the existing User model or use a separate model
 Support:
email
password hash
status
patient profile link
 Files:
prisma/schema.prisma
Patient Authentication
 Create routes:
POST /api/patient-auth/login
POST /api/patient-auth/logout
GET  /api/patient-auth/me
 Add patient JWT support
 Add patient auth middleware

Files:

src/routes/patientAuth.routes.ts
src/controllers/patientAuth.controller.ts
src/middleware/requirePatientAuth.ts
Patient Dashboard

Create:

/patient

Display:

patient name
active pathway
next pathway task
unread notifications
recent activity

Files:

client/src/pages/PatientDashboardPage.tsx
Patient Pathway Experience

Routes:

GET /api/patient/me/pathway-enrollments
GET /api/patient/me/pathway-enrollments/:id
GET /api/patient/me/pathway-enrollments/:id/steps

Display:

current pathway
completed tasks
upcoming tasks
pathway progress %
Patient Check-Ins

Create:

PatientCheckIn

Suggested fields:

id
patientId
enrollmentId
stepId
responses
submittedAt

Routes:

GET  /api/patient-check-ins/:id
POST /api/patient-check-ins

Examples:

Pain score
Drain output
Temperature
Nausea
Infection symptoms

Files:

prisma/schema.prisma
src/routes/patientCheckIns.routes.ts
src/controllers/patientCheckIns.controller.ts
In-App Notifications

Update Notification model.

Add channel:

IN_APP

Add fields:

isRead
readAt

Routes:

GET   /api/patient/me/notifications
PATCH /api/notifications/:id/read

Files:

src/routes/notifications.routes.ts
src/controllers/notifications.controller.ts
Push Notification Support

Create:

PatientDevice

Fields:

id
patientId
platform
pushToken
lastSeenAt

Platforms:

IOS
ANDROID
WEB

Files:

prisma/schema.prisma

Routes:

POST /api/patient/devices
DELETE /api/patient/devices/:id
Patient Messaging Center

Display:

notification history
pathway reminders
clinician messages

Route:

/patient/messages

Files:

client/src/pages/PatientMessagesPage.tsx
Mobile Readiness

Ensure:

responsive layouts
large touch targets
simplified navigation
mobile-first forms
Tests

Add tests for:

POST /api/patient-auth/login
GET  /api/patient-auth/me
GET  /api/patient/me/pathway-enrollments
POST /api/patient-check-ins
GET  /api/patient/me/notifications
PATCH /api/notifications/:id/read

Verify:

patients only access their own data
patients cannot access other patients
invalid JWT rejected
Acceptance Criteria
Patient can log in.
Patient can view active pathway.
Patient can view pathway progress.
Patient can submit check-ins.
Patient can receive in-app notifications.
Patient can mark notifications as read.
Patient can register push notification devices.
Patient can only access their own records.
Frontend builds successfully.
Tests pass.
Recommended Cursor Prompt
Implement Phase 11 (Patient Experience Platform) from core-skeleton/ROADMAP.md.

Create a patient-facing portal with authentication, pathway tracking, check-ins, in-app notifications, and push notification readiness.

Add:
- Patient authentication
- Patient dashboard
- Patient pathway views
- Patient check-ins
- In-app notifications
- Push notification device registration
- Patient messaging center

Support notification channels:
- IN_APP
- PUSH
- EMAIL
- SMS

Do not integrate SendGrid or Twilio yet.

Patients must only access their own data.

Add backend tests and frontend pages.

Run:
- npx prisma migrate dev
- npm test
- npm run typecheck
- cd client && npm run build

---

## Phase 12 — External Communications

Connect the internal notification framework to real email and SMS providers.

This phase should only happen after internal notification records, auth, clinic isolation, audit logging, and deployment prep are stable. The app should already know what needs to be sent before this phase adds real delivery.

### Checklist

* [ ] **Choose provider strategy**

  * Email provider:

    * SendGrid recommended
    * Alternative: AWS SES, Postmark, Mailgun
  * SMS provider:

    * Twilio recommended
  * Keep provider-specific code isolated in services.
  * Files:

    * `docs/NOTIFICATIONS.md`

* [ ] **Add email provider environment variables**

  * Add to `.env.example`:

    * `EMAIL_PROVIDER`
    * `SENDGRID_API_KEY`
    * `SENDGRID_FROM_EMAIL`
    * `SENDGRID_FROM_NAME`
  * Files:

    * `.env.example`

* [ ] **Add SMS provider environment variables**

  * Add to `.env.example`:

    * `SMS_PROVIDER`
    * `TWILIO_ACCOUNT_SID`
    * `TWILIO_AUTH_TOKEN`
    * `TWILIO_FROM_NUMBER`
  * Files:

    * `.env.example`

* [ ] **Create email service**

  * Add provider wrapper:

    * `sendEmailNotification(notificationId)`
  * Should:

    * load notification record
    * send email through provider
    * update status to `SENT` or `FAILED`
    * store failure reason if failed
  * Files:

    * `src/services/email.service.ts`
    * `src/services/notificationDelivery.service.ts`

* [ ] **Create SMS service**

  * Add provider wrapper:

    * `sendSmsNotification(notificationId)`
  * Should:

    * load notification record
    * send SMS through provider
    * update status to `SENT` or `FAILED`
    * store failure reason if failed
  * Files:

    * `src/services/sms.service.ts`
    * `src/services/notificationDelivery.service.ts`

* [ ] **Add notification delivery route**

  * `POST /api/notifications/:id/send`

    * Sends one queued notification
    * Requires auth
    * Enforces clinic access
  * Files:

    * `src/routes/notifications.routes.ts`
    * `src/controllers/notifications.controller.ts`

* [ ] **Add bulk delivery route**

  * `POST /api/notifications/send-queued`

    * Sends queued notifications
    * Optional filters:

      * `clinicId`
      * `channel`
      * `scheduledBefore`
    * Should be safe for manual/admin use.
  * Files:

    * `src/routes/notifications.routes.ts`
    * `src/controllers/notifications.controller.ts`

* [ ] **Add delivery status updates**

  * Notification status changes:

    * `QUEUED` → `SENT`
    * `QUEUED` → `FAILED`
  * Store:

    * `sentAt`
    * `failedAt`
    * `failureReason`
    * optional provider message ID
  * Files:

    * `prisma/schema.prisma`
    * notification services/controllers

* [ ] **Add provider message ID fields**

  * Add fields such as:

    * `provider`
    * `providerMessageId`
    * `providerStatus`
  * Files:

    * `prisma/schema.prisma`

* [ ] **Add webhook placeholders**

  * Optional routes:

    * `POST /api/webhooks/sendgrid`
    * `POST /api/webhooks/twilio`
  * These can be documented/stubbed if not fully implemented.
  * Files:

    * `src/routes/webhooks.routes.ts`
    * `src/controllers/webhooks.controller.ts`

* [ ] **Add retry behavior**

  * Add simple retry fields:

    * `attemptCount`
    * `lastAttemptAt`
    * `nextAttemptAt`
  * Failed notifications can be retried manually.
  * Files:

    * `prisma/schema.prisma`
    * `src/services/notificationDelivery.service.ts`

* [ ] **Add notification delivery audit logs**

  * Log:

    * notification sent
    * notification failed
    * notification retried
  * Files:

    * `src/services/audit.service.ts`
    * `src/services/notificationDelivery.service.ts`

* [ ] **Add tests with mocked providers**

  * Do not send real emails/texts in tests.
  * Mock provider calls.
  * Test:

    * send queued email success
    * send queued SMS success
    * provider failure marks notification failed
    * cross-clinic send attempt is blocked
    * bulk send only sends allowed queued notifications
  * Files:

    * `tests/notifications.test.ts`
    * or `tests/api.test.ts`

* [ ] **Add notification documentation**

  * Create `docs/NOTIFICATIONS.md`
  * Include:

    * notification lifecycle
    * provider configuration
    * local dev behavior
    * testing behavior
    * webhook notes
    * retry strategy
    * PHI caution
  * Files:

    * `docs/NOTIFICATIONS.md`

### Acceptance Criteria

* Queued email notifications can be sent through the configured email provider.
* Queued SMS notifications can be sent through the configured SMS provider.
* Provider code is isolated in services.
* Notification status updates after delivery attempt.
* Failures store failure reason.
* Provider message ID/status can be stored.
* Cross-clinic send attempts are blocked.
* Tests mock provider calls and do not send real messages.
* Audit logs are created for send/fail/retry events.
* `.env.example` includes all provider variables.
* `docs/NOTIFICATIONS.md` documents setup and limitations.
* `npm test` passes.
* `npm run typecheck` passes.

### Recommended Cursor Prompt

```txt
Implement Phase 12 (External Communications) from core-skeleton/ROADMAP.md.

Connect the existing internal notification framework to real provider services while keeping provider-specific code isolated.

Add SendGrid-style email support and Twilio-style SMS support, but make provider calls mockable for tests. Do not send real messages in tests.

Create services:
- src/services/email.service.ts
- src/services/sms.service.ts
- src/services/notificationDelivery.service.ts

Create/update routes:
- POST /api/notifications/:id/send
- POST /api/notifications/send-queued
- optional POST /api/webhooks/sendgrid
- optional POST /api/webhooks/twilio

Update Notification schema with provider, providerMessageId, providerStatus, attemptCount, lastAttemptAt, nextAttemptAt, sentAt, failedAt, and failureReason as needed.

Add audit logs for notification sent, failed, and retried. Enforce clinic-scoped access for sending notifications.

Update .env.example with email/SMS provider variables. Create docs/NOTIFICATIONS.md.

Add tests with mocked providers for email success, SMS success, provider failure, retry behavior, and cross-clinic protection.

Run:
- npx prisma migrate dev
- npm test
- npm run typecheck
```
---

# Phase 13 — Reporting & Analytics

Build analytics and reporting capabilities for clinicians, clinic admins, and future pilot customers.

This phase focuses on operational visibility into patient engagement, pathway performance, clinician workload, and notification effectiveness.

## Checklist

* [ ] **Create analytics service**

  * Create:

    * `src/services/analytics.service.ts`
  * Support aggregation for:

    * active patients
    * active enrollments
    * completed enrollments
    * pathway completion rates
    * missed check-ins
    * completed check-ins
    * active notifications
    * failed notifications

* [ ] **Create analytics routes**

  * Create:

    * `GET /api/analytics/overview`
    * `GET /api/analytics/pathways`
    * `GET /api/analytics/notifications`
    * `GET /api/analytics/check-ins`
    * `GET /api/analytics/patients`

  * Optional filters:

    * `clinicId`
    * `startDate`
    * `endDate`
    * `pathwayTemplateId`

  * Files:

    * `src/routes/analytics.routes.ts`
    * `src/controllers/analytics.controller.ts`

* [ ] **Add pathway analytics**

  * Track:

    * enrollment count
    * completion count
    * completion percentage
    * average completion time
    * abandonment count
    * abandonment percentage

* [ ] **Add check-in analytics**

  * Track:

    * completed check-ins
    * missed check-ins
    * overdue check-ins
    * average response time

* [ ] **Add notification analytics**

  * Track:

    * sent notifications
    * failed notifications
    * opened notifications
    * responded notifications

  * Group by:

    * IN_APP
    * PUSH
    * EMAIL
    * SMS

* [ ] **Create analytics dashboard page**

  * Route:

    * `/analytics`

  * Files:

    * `client/src/pages/AnalyticsPage.tsx`

* [ ] **Create analytics components**

  * Files:

    * `client/src/components/AnalyticsSummaryCards.tsx`
    * `client/src/components/PathwayMetricsTable.tsx`
    * `client/src/components/NotificationMetricsTable.tsx`
    * `client/src/components/CheckInMetricsTable.tsx`

* [ ] **Add analytics tests**

  * Verify:

    * analytics endpoints return data
    * clinic filtering works
    * cross-clinic analytics are blocked

## Acceptance Criteria

* Analytics endpoints return meaningful data.
* Analytics respect clinic-level access controls.
* Clinicians can view engagement metrics.
* Pathway completion rates are calculated correctly.
* Notification metrics are available.
* Frontend dashboard displays analytics.
* `npm test` passes.
* `npm run typecheck` passes.
* `cd client && npm run build` passes.

## Recommended Cursor Prompt

```txt
Implement Phase 13 (Reporting & Analytics) from ROADMAP.md.

Create analytics services, controllers, routes, and frontend dashboards.

Add analytics for:
- pathway completion
- pathway adherence
- missed check-ins
- notification performance
- clinician workload

Create:
- GET /api/analytics/overview
- GET /api/analytics/pathways
- GET /api/analytics/notifications
- GET /api/analytics/check-ins
- GET /api/analytics/patients

Preserve clinic-scoped access controls.

Run:
- npm test
- npm run typecheck
- cd client && npm run build
```

---

# Phase 14 — Admin Platform & Pathway Builder

Create a complete administrative experience that allows clinics to manage users, pathways, notification templates, and clinic settings without modifying code.

## Checklist

* [ ] **Create admin routes**

  * Create:

    * `GET /api/admin/users`
    * `POST /api/admin/users`
    * `PATCH /api/admin/users/:id`
    * `DELETE /api/admin/users/:id`

* [ ] **Create clinic management routes**

  * Create:

    * `GET /api/admin/clinics`
    * `PATCH /api/admin/clinics/:id`

* [ ] **Create notification template model**

  * Create:

    * `NotificationTemplate`

  * Fields:

    * name
    * channel
    * subject
    * body
    * active

* [ ] **Create notification template routes**

  * Create:

    * `GET /api/notification-templates`
    * `POST /api/notification-templates`
    * `PATCH /api/notification-templates/:id`
    * `DELETE /api/notification-templates/:id`

* [ ] **Create pathway builder routes**

  * Create:

    * `GET /api/admin/pathways`
    * `POST /api/admin/pathways`
    * `PATCH /api/admin/pathways/:id`
    * `DELETE /api/admin/pathways/:id`

* [ ] **Create admin frontend pages**

  * Routes:

    * `/admin/users`
    * `/admin/clinics`
    * `/admin/pathways`
    * `/admin/notification-templates`

* [ ] **Create pathway builder UI**

  * Allow:

    * create pathway
    * edit pathway
    * add step
    * reorder steps
    * remove steps
    * publish pathway

## Acceptance Criteria

* Admins can create users.
* Admins can manage clinics.
* Admins can create pathways without code changes.
* Admins can create notification templates.
* Published pathways are immediately available.
* Tests pass.
* Frontend build passes.

## Recommended Cursor Prompt

```txt
Implement Phase 14 (Admin Platform & Pathway Builder).

Create a complete admin experience including:

- user management
- clinic management
- pathway builder
- notification templates

Allow pathways to be built entirely through the UI.

Run:
- npm test
- npm run typecheck
- cd client && npm run build
```

---

# Phase 15 — Operational Features

Add production-grade operational capabilities expected by clinic staff.

## Checklist

* [ ] **Create password reset workflow**

  * Routes:

    * `POST /api/auth/forgot-password`
    * `POST /api/auth/reset-password`
    * `POST /api/patient-auth/forgot-password`
    * `POST /api/patient-auth/reset-password`

* [ ] **Create PasswordResetToken model**

  * Fields:

    * token
    * expiresAt
    * usedAt

* [ ] **Create invitation workflow**

  * Model:

    * `UserInvitation`

  * Routes:

    * `POST /api/admin/invitations`
    * `GET /api/admin/invitations`

* [ ] **Create notification preferences**

  * Model:

    * `NotificationPreference`

  * Channels:

    * IN_APP
    * PUSH
    * EMAIL
    * SMS

  * Routes:

    * `GET /api/preferences`
    * `PATCH /api/preferences`

* [ ] **Create export jobs**

  * Model:

    * `ExportJob`

  * Routes:

    * `POST /api/export`
    * `GET /api/export/:id`

* [ ] **Support exports**

  * CSV
  * XLSX

* [ ] **Create settings page**

  * Route:

    * `/settings`

## Acceptance Criteria

* Users can recover accounts.
* Users can configure notification preferences.
* Invitations work.
* Export jobs work.
* CSV exports function correctly.
* Tests pass.
* Frontend build passes.

## Recommended Cursor Prompt

```txt
Implement Phase 15 (Operational Features).

Add:

- password recovery
- user invitations
- notification preferences
- export jobs
- settings page

Support CSV and XLSX exports.

Run:
- npm test
- npm run typecheck
- cd client && npm run build
```

---

# Phase 16 — Pilot Program Infrastructure

Create tooling required for onboarding and supporting pilot clinics.

## Checklist

* [ ] **Create feedback model**

  * Create:

    * `Feedback`

  * Fields:

    * userId
    * clinicId
    * category
    * message
    * status

* [ ] **Create feature flag model**

  * Create:

    * `FeatureFlag`

  * Fields:

    * name
    * enabled
    * clinicId

* [ ] **Create clinic onboarding model**

  * Create:

    * `ClinicOnboarding`

* [ ] **Create feedback routes**

  * Create:

    * `POST /api/feedback`
    * `GET /api/feedback`

* [ ] **Create feature flag routes**

  * Create:

    * `GET /api/feature-flags`
    * `PATCH /api/feature-flags/:id`

* [ ] **Create pilot admin dashboard**

  * Route:

    * `/admin/pilot`

* [ ] **Create onboarding tracking**

  * Track:

    * onboarding progress
    * imported patients
    * clinician setup
    * pathway configuration

* [ ] **Create pilot documentation**

  * Files:

    * `docs/PILOT_GUIDE.md`
    * `docs/ONBOARDING_GUIDE.md`

## Acceptance Criteria

* Pilot clinics can be onboarded.
* Feature flags work.
* Feedback collection works.
* Onboarding progress is visible.
* Documentation exists.
* Tests pass.

## Recommended Cursor Prompt

```txt
Implement Phase 16 (Pilot Program Infrastructure).

Create:

- feedback system
- feature flags
- onboarding tracking
- pilot admin dashboard

Add onboarding and pilot documentation.

Run:
- npm test
- npm run typecheck
```

---

# Phase 17 — Healthcare Compliance Foundation

Build the technical and documentation foundation for future HIPAA and healthcare compliance efforts.

This phase does not claim HIPAA compliance.

## Checklist

* [ ] **Create PHI inventory documentation**

  * Create:

    * `docs/PHI_INVENTORY.md`

* [ ] **Create access control documentation**

  * Create:

    * `docs/ACCESS_CONTROL.md`

* [ ] **Create audit logging documentation**

  * Create:

    * `docs/AUDIT_LOGGING.md`

* [ ] **Create retention policy documentation**

  * Create:

    * `docs/RETENTION_POLICY.md`

* [ ] **Create security architecture documentation**

  * Create:

    * `docs/SECURITY_ARCHITECTURE.md`

* [ ] **Review encryption**

  * Data at rest
  * Data in transit
  * Secrets management

* [ ] **Review audit logging coverage**

  * Patients
  * Check-ins
  * Notifications
  * Pathway enrollments
  * Authentication events

* [ ] **Review backup strategy**

  * Database backups
  * Restore procedures

* [ ] **Review disaster recovery**

  * Recovery process
  * Recovery objectives

* [ ] **Review incident response**

  * Security incidents
  * Data breach procedures

## Acceptance Criteria

* PHI inventory completed.
* Access control documentation completed.
* Security architecture documented.
* Audit coverage reviewed.
* Backup and recovery plans documented.
* Compliance foundation documentation exists.

## Recommended Cursor Prompt

```txt
Implement Phase 17 (Healthcare Compliance Foundation).

Create healthcare compliance preparation documentation and perform architecture reviews.

Create:
- PHI inventory
- access control documentation
- audit logging documentation
- retention policy
- security architecture documentation

Review:
- encryption
- backups
- disaster recovery
- incident response

Do not claim HIPAA compliance.

Focus on creating the foundation required for future compliance efforts.
```

---



