# API Contract — Phase 2.5 Review

**Product:** Oncology post-operative clinic backend (cancer clinics only).  
**Base URL (local):** `http://localhost:3000`  
**Source of truth:** `core-skeleton/src/routes/`, `src/controllers/`, `src/lib/http.ts`, `src/middleware/validate.ts`

This document describes the **current** API behavior after Phase 1 (response envelope, CORS) and Phase 2 (seed data). It is intended for Phase 3 frontend work. No `error.code` field exists today—only `error.message` and optional `error.details`.

---

## Standard response envelope

### Success

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

- HTTP status is typically `200` or `201` (create).
- Resource payload is always under `data`.

### Failure

```json
{
  "success": false,
  "data": null,
  "error": {
    "message": "Human-readable message",
    "details": {}
  }
}
```

- `data` is **always** `null` when `success` is `false`.
- `error.details` is **optional**. It is present for Zod validation failures (array of Zod issues).
- There is **no** `error.code` in the current implementation. Clients should use HTTP status + `error.message` (and `error.details` when present).

### Global server error (500)

Unhandled exceptions use the same failure envelope; `error.message` is the exception message or `"Server error"`.

---

## Route index

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Liveness check |
| `GET` | `/__debug` | Route mount list (non-production only) |
| `GET` | `/api/clinics` | List clinics |
| `GET` | `/api/clinics/:id` | Get clinic |
| `POST` | `/api/clinics` | Create clinic |
| `PATCH` | `/api/clinics/:id` | Update clinic |
| `GET` | `/api/clinics/:id/queue` | Active enrollment queue (clinic-scoped) |
| `GET` | `/api/pathways` | List pathways |
| `GET` | `/api/pathways/:id` | Get pathway |
| `POST` | `/api/pathways` | Create pathway |
| `PATCH` | `/api/pathways/:id` | Update pathway |
| `GET` | `/api/users` | List users |
| `GET` | `/api/users/:id` | Get user |
| `PATCH` | `/api/users/:id` | Update user |
| `POST` | `/api/patients?clinicId=` | Create patient (+ user) |
| `GET` | `/api/patients?clinicId=` | List patients for clinic |
| `GET` | `/api/patients/:id` | Get patient |
| `PATCH` | `/api/patients/:id` | Update patient |
| `GET` | `/api/enrollments` | List enrollments |
| `GET` | `/api/enrollments/:id` | Get enrollment |
| `PATCH` | `/api/enrollments/:id` | Update enrollment status |
| `POST` | `/api/workflows/onboard` | Onboard patient (user + patient + enrollment) |
| `GET` | `/api/workflows/clinics/:id/queue` | Active queue (preferred for dashboard) |
| `GET` | `/api/workflows/patients/:id/dashboard` | Patient detail + enrollments |

---

## Shared model shapes (Prisma)

### Clinic

```json
{ "id": "cuid", "name": "string", "createdAt": "ISO-8601" }
```

### Pathway

```json
{ "id": "cuid", "clinicId": "cuid", "name": "string", "createdAt": "ISO-8601" }
```

### User

```json
{
  "id": "cuid",
  "clinicId": "cuid",
  "email": "string",
  "role": "PATIENT | CLINICIAN | ADMIN",
  "status": "INVITED | ACTIVE | DISABLED",
  "createdAt": "ISO-8601"
}
```

### Patient (often includes `user`)

```json
{
  "id": "cuid",
  "clinicId": "cuid",
  "userId": "cuid",
  "firstName": "string | null",
  "lastName": "string | null",
  "phone": "string | null",
  "createdAt": "ISO-8601",
  "user": { }
}
```

### Enrollment (list/get includes `patient`, `pathway`)

```json
{
  "id": "cuid",
  "patientId": "cuid",
  "pathwayId": "cuid",
  "status": "ACTIVE | PAUSED | COMPLETED",
  "createdAt": "ISO-8601"
}
```

### Queue entry (clinic queue endpoints)

```json
{
  "enrollmentId": "cuid",
  "status": "ACTIVE",
  "createdAt": "ISO-8601",
  "patientName": "Maria Garcia",
  "pathwayName": "Mastectomy recovery"
}
```

Only enrollments with `status: "ACTIVE"` appear in queue responses.

---

## Seed reference (`npx prisma db seed`)

Use these stable names/emails when testing against a seeded database:

| Type | Values |
|------|--------|
| Clinics | **Lakeside Oncology Center**, **Westbrook Cancer Institute** |
| Lakeside pathways | Breast lumpectomy recovery, Mastectomy recovery, Colon cancer surgery recovery, Prostatectomy recovery |
| Westbrook pathways | Port placement care, Post-op symptom monitoring, Drain care instructions, Surgical wound care after oncology procedure |
| Admin | `admin@example.com` (ADMIN, Lakeside) |
| Sample patient | `maria.garcia@example.com` — Maria Garcia, Mastectomy recovery, **ACTIVE** |

---

## System routes

### `GET /health`

| | |
|--|--|
| **Purpose** | Verify API is running. |
| **Request** | None. |
| **Success `data`** | `{ "ok": true, "ts": "<ISO-8601>" }` |
| **Common errors** | `500` — unhandled error. |

**Success example**

```json
{
  "success": true,
  "data": { "ok": true, "ts": "2026-06-02T12:00:00.000Z" },
  "error": null
}
```

---

### `GET /__debug`

| | |
|--|--|
| **Purpose** | List mounted `/api/*` prefixes (development only). |
| **Availability** | Not registered when `NODE_ENV=production`. |
| **Success `data`** | `{ "where": "src/app.ts", "mounts": [...], "ts": "..." }` |

---

## Clinics — `/api/clinics`

### `GET /api/clinics`

| | |
|--|--|
| **Purpose** | List all clinics (newest first). Used for clinic picker on dashboard. |
| **Request** | None. |
| **Success `data`** | `Clinic[]` |
| **Common errors** | `500` server error. |

**Success example (excerpt after seed)**

```json
{
  "success": true,
  "data": [
    { "id": "…", "name": "Lakeside Oncology Center", "createdAt": "…" },
    { "id": "…", "name": "Westbrook Cancer Institute", "createdAt": "…" }
  ],
  "error": null
}
```

---

### `GET /api/clinics/:id`

| | |
|--|--|
| **Purpose** | Get one clinic. |
| **Params** | `id` — clinic cuid. |
| **Success `data`** | `Clinic` |
| **Common errors** | `400` Invalid clinic id · `404` Clinic not found |

**Error example**

```json
{
  "success": false,
  "data": null,
  "error": { "message": "Clinic not found" }
}
```

---

### `POST /api/clinics`

| | |
|--|--|
| **Purpose** | Create a clinic. |
| **Body** | `{ "name": "string" }` (min length 1) |
| **Success `data`** | Created `Clinic` (`201`) |
| **Common errors** | `400` validation (`error.details` with Zod issues) |

**Error example (empty name)**

```json
{
  "success": false,
  "data": null,
  "error": {
    "message": "Invalid request",
    "details": [{ "code": "too_small", "path": ["name"], "message": "…" }]
  }
}
```

---

### `PATCH /api/clinics/:id`

| | |
|--|--|
| **Purpose** | Update clinic name. |
| **Body** | `{ "name": "string" }` — at least one field required. |
| **Success `data`** | Updated `Clinic` |
| **Common errors** | `400` validation / empty body · `404` Clinic not found |

---

### `GET /api/clinics/:id/queue`

| | |
|--|--|
| **Purpose** | Active enrollment queue for clinic (same payload as workflow queue). |
| **Success `data`** | `QueueEntry[]` |
| **Note** | Prefer `GET /api/workflows/clinics/:id/queue` for Phase 3 dashboard. |

**Success example (Lakeside, seeded)**

```json
{
  "success": true,
  "data": [
    {
      "enrollmentId": "…",
      "status": "ACTIVE",
      "createdAt": "…",
      "patientName": "Maria Garcia",
      "pathwayName": "Mastectomy recovery"
    },
    {
      "enrollmentId": "…",
      "status": "ACTIVE",
      "patientName": "James Wilson",
      "pathwayName": "Breast lumpectomy recovery"
    }
  ],
  "error": null
}
```

---

## Pathways — `/api/pathways`

### `GET /api/pathways`

| | |
|--|--|
| **Purpose** | List pathways; filter by clinic for onboard form. |
| **Query** | `clinicId` (optional) |
| **Success `data`** | `Pathway[]` |

**Example**

`GET /api/pathways?clinicId=<lakeside-id>` → includes **Mastectomy recovery**, **Breast lumpectomy recovery**, etc.

---

### `GET /api/pathways/:id`

| | |
|--|--|
| **Purpose** | Get one pathway. |
| **Common errors** | `404` Pathway not found |

---

### `POST /api/pathways`

| | |
|--|--|
| **Purpose** | Create pathway for a clinic. |
| **Body** | `{ "clinicId": "cuid", "name": "Mastectomy recovery" }` |
| **Success `data`** | Created `Pathway` (`201`) |
| **Common errors** | `404` Clinic not found · `400` validation |

**Error example**

```json
{
  "success": false,
  "data": null,
  "error": { "message": "Clinic not found" }
}
```

---

### `PATCH /api/pathways/:id`

| | |
|--|--|
| **Purpose** | Rename pathway. |
| **Body** | `{ "name": "string" }` |
| **Common errors** | `404` Pathway not found |

---

## Users — `/api/users`

### `GET /api/users`

| | |
|--|--|
| **Purpose** | List users; optional filter by clinic. |
| **Query** | `clinicId` (optional) |
| **Success `data`** | `User[]` (includes seeded `admin@example.com`) |

---

### `GET /api/users/:id`

| | |
|--|--|
| **Purpose** | Get one user. |
| **Common errors** | `404` User not found |

---

### `PATCH /api/users/:id`

| | |
|--|--|
| **Purpose** | Update email, role, or status. |
| **Body** | Any of: `email`, `role` (`PATIENT` \| `CLINICIAN` \| `ADMIN`), `status` (`INVITED` \| `ACTIVE` \| `DISABLED`) — at least one field. |
| **Common errors** | `400` validation · `404` User not found |

---

## Patients — `/api/patients`

### `POST /api/patients?clinicId={clinicId}`

| | |
|--|--|
| **Purpose** | Create patient + linked user (auto-generated email). **Not** the main onboard path. |
| **Query** | `clinicId` required |
| **Body** | `{ "firstName", "lastName", "phone" }` (phone min 7 chars) |
| **Success `data`** | `Patient` with `user` (`201`) |

---

### `GET /api/patients?clinicId={clinicId}`

| | |
|--|--|
| **Purpose** | List patients at a clinic (includes `user` for email lookup). |
| **Query** | `clinicId` required |
| **Success `data`** | `Patient[]` |

Use this to resolve `patientId` for dashboard when you only know email (e.g. `maria.garcia@example.com`).

---

### `GET /api/patients/:id`

| | |
|--|--|
| **Purpose** | Get one patient with `user`. |
| **Common errors** | `404` Patient not found |

---

### `PATCH /api/patients/:id`

| | |
|--|--|
| **Purpose** | Update demographics. |
| **Body** | Any of `firstName`, `lastName`, `phone` |
| **Common errors** | `404` Patient not found |

---

## Enrollments — `/api/enrollments`

There is **no** `POST /api/enrollments`. Create enrollments via `POST /api/workflows/onboard`.

### `GET /api/enrollments`

| | |
|--|--|
| **Purpose** | List enrollments with patient and pathway. |
| **Query** | `patientId` and/or `clinicId` (optional) |
| **Success `data`** | `Enrollment[]` with nested relations |

---

### `GET /api/enrollments/:id`

| | |
|--|--|
| **Purpose** | Get one enrollment. |
| **Common errors** | `404` Enrollment not found |

---

### `PATCH /api/enrollments/:id`

| | |
|--|--|
| **Purpose** | Change enrollment status (e.g. pause pathway). |
| **Body** | `{ "status": "ACTIVE" \| "PAUSED" \| "COMPLETED" }` |
| **Common errors** | `404` · `400` invalid status |

**Success example**

```json
{
  "success": true,
  "data": {
    "id": "…",
    "status": "PAUSED",
    "patient": { "firstName": "Elena", "lastName": "Rodriguez" },
    "pathway": { "name": "Colon cancer surgery recovery" }
  },
  "error": null
}
```

---

## Workflows — `/api/workflows`

### `POST /api/workflows/onboard`

| | |
|--|--|
| **Purpose** | Single transaction: resolve/create clinic, create user + patient, create **ACTIVE** enrollment. |
| **Body** | See table below |
| **Success `data`** | `{ clinic, user, patient, enrollment }` (`201`) |
| **Common errors** | `400` validation · `409` duplicate email · `500` clinic not found |

| Field | Required | Notes |
|-------|----------|-------|
| `clinicId` | one of `clinicId` / `clinicName` | Existing clinic (e.g. Lakeside id) |
| `clinicName` | one of `clinicId` / `clinicName` | Creates new clinic if no `clinicId` |
| `pathwayId` | yes | Must belong to the clinic |
| `patient.email` | yes | Unique |
| `patient.firstName` | yes | |
| `patient.lastName` | yes | |
| `patient.phone` | no | min 7 if sent |

**Success example (oncology)**

```json
{
  "success": true,
  "data": {
    "clinic": { "name": "Lakeside Oncology Center", "id": "…" },
    "user": {
      "email": "ana.lopez@example.com",
      "role": "PATIENT",
      "status": "INVITED"
    },
    "patient": { "firstName": "Ana", "lastName": "Lopez" },
    "enrollment": {
      "status": "ACTIVE",
      "pathway": { "name": "Mastectomy recovery" }
    }
  },
  "error": null
}
```

**Error example (duplicate email)**

```json
{
  "success": false,
  "data": null,
  "error": { "message": "A user with that email already exists" }
}
```

HTTP `409`.

---

### `GET /api/workflows/clinics/:id/queue`

| | |
|--|--|
| **Purpose** | **Clinic dashboard queue** — ACTIVE enrollments only. |
| **Success `data`** | `QueueEntry[]` (may be `[]`) |

---

### `GET /api/workflows/patients/:id/dashboard`

| | |
|--|--|
| **Purpose** | **Patient detail page** — patient, user, enrollments with pathways. |
| **Success `data`** | `{ "patient": Patient & { user, enrollments }, "enrollments": Enrollment[] }` |
| **Common errors** | `404` Patient not found |

**Success example (Maria Garcia, seeded)**

```json
{
  "success": true,
  "data": {
    "patient": {
      "firstName": "Maria",
      "lastName": "Garcia",
      "user": { "email": "maria.garcia@example.com", "role": "PATIENT" },
      "enrollments": [
        {
          "status": "ACTIVE",
          "pathway": { "name": "Mastectomy recovery" }
        }
      ]
    },
    "enrollments": [
      {
        "status": "ACTIVE",
        "pathway": { "name": "Mastectomy recovery" }
      }
    ]
  },
  "error": null
}
```

---

## Phase 3 frontend workflows

### Clinic dashboard flow

1. `GET /api/clinics` — populate clinic selector (**Lakeside Oncology Center**, **Westbrook Cancer Institute**).
2. User selects a clinic → store `clinicId`.
3. `GET /api/workflows/clinics/:clinicId/queue` — render table of ACTIVE patients (patientName, pathwayName, status, createdAt).

**UI assumptions:** Queue rows do not include `patientId`; link to patient detail requires a separate lookup (`GET /api/patients?clinicId=`) or storing ids from onboard.

---

### Onboard patient flow

1. `GET /api/clinics` — clinic dropdown.
2. `GET /api/pathways?clinicId=…` — pathway dropdown (e.g. **Port placement care** at Westbrook).
3. `POST /api/workflows/onboard` — submit patient form.
4. On `201`, read `data.patient.id` and `data.enrollment` for confirmation / redirect to patient detail.

**Validation errors:** Show `error.message` and optionally map `error.details` to form fields.

---

### Patient detail flow

1. Navigate with `patientId` (from onboard response or patient list).
2. `GET /api/workflows/patients/:patientId/dashboard` — show demographics, email, enrollment list with pathway names and statuses.

---

## Example `curl` sequence (seeded DB)

```bash
export API="http://localhost:3000"

# 1. List clinics
curl -s "$API/api/clinics" | jq '.data[] | {id, name}'

export CLINIC_ID="$(curl -s "$API/api/clinics" | jq -r '.data[] | select(.name=="Lakeside Oncology Center") | .id')"

# 2. Queue
curl -s "$API/api/workflows/clinics/$CLINIC_ID/queue" | jq .

# 3. Pathways for onboard
curl -s "$API/api/pathways?clinicId=$CLINIC_ID" | jq '.data[] | {id, name}'

export PATHWAY_ID="$(curl -s "$API/api/pathways?clinicId=$CLINIC_ID" | jq -r '.data[] | select(.name=="Mastectomy recovery") | .id')"

curl -s -X POST "$API/api/workflows/onboard" \
  -H "Content-Type: application/json" \
  -d "{
    \"clinicId\": \"$CLINIC_ID\",
    \"pathwayId\": \"$PATHWAY_ID\",
    \"patient\": {
      \"email\": \"ana.lopez@example.com\",
      \"firstName\": \"Ana\",
      \"lastName\": \"Lopez\",
      \"phone\": \"555-0199\"
    }
  }" | jq .

# 4. Dashboard (seeded Maria)
export PATIENT_ID="$(curl -s "$API/api/patients?clinicId=$CLINIC_ID" | jq -r '.data[] | select(.user.email=="maria.garcia@example.com") | .id')"
curl -s "$API/api/workflows/patients/$PATIENT_ID/dashboard" | jq .
```

---

## Manual smoke test

With the dev server running and database seeded:

```bash
cd core-skeleton
npm run dev          # terminal 1 — http://localhost:3000
npx prisma db seed   # once
npm run smoke:api    # terminal 2
```

---

## CORS

Browser requests from `http://localhost:5173` are allowed (`credentials: true`) for the future Vite app.

---

## Frontend Blockers / Notes

| Topic | Impact on Phase 3 |
|-------|-------------------|
| **No authentication** | All endpoints are public; no `Authorization` header or session. Frontend cannot model real clinic-staff login yet. |
| **No `error.code`** | Only `error.message` + optional `error.details`. Consider adding stable codes later for i18n and branching (documented here; not implemented). |
| **Duplicate queue endpoints** | `GET /api/clinics/:id/queue` and `GET /api/workflows/clinics/:id/queue` return the same shape. Frontend should standardize on the **workflows** path. |
| **Queue rows lack `patientId`** | Dashboard table must match by name or prefetch patients to build links to `/patients/:id`. |
| **`GET /api/patients` requires `clinicId`** | No global patient search; clinic must be selected first. |
| **No `POST /api/enrollments`** | Onboarding must use `/api/workflows/onboard` only. |
| **Dashboard duplicate enrollments** | Response includes both `data.patient.enrollments` and `data.enrollments` (same data). Frontend can use either; pick one convention. |
| **Pathway / clinic not unique by name** | IDs are required for API calls; always use list endpoints after seed, not hard-coded cuids. |
| **Seed required for demos** | Run `npx prisma db seed` before UI dev; smoke test fails without **Lakeside Oncology Center** and **maria.garcia@example.com**. |
| **No pagination** | List endpoints return full tables; fine for MVP demo, may need paging later. |
| **`POST /api/patients` vs onboard** | Alternate patient create uses generated email; prefer onboard for real workflow. |
| **Test data pollution** | Integration tests create extra clinics; list UIs may show non-seed rows in dev DB. |

---

## Related files

| File | Role |
|------|------|
| `docs/API.md` | Earlier Phase 2.5 summary (optional reference) |
| `scripts/smoke-test-api.sh` | Automated contract smoke test |
| `test-api.http` | REST Client examples |
| `ROADMAP.md` | Phase 3+ planning |
