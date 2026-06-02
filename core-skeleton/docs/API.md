# Healthcare API — Contract (Phase 2.5)

Oncology post-operative clinic backend. Base URL in local development:

```text
http://localhost:3000
```

All `/api/*` routes expect `Content-Type: application/json` for bodies. Responses use a single envelope unless noted.

---

## Response envelope

### Success

```json
{
  "success": true,
  "data": <resource or array>,
  "error": null
}
```

### Failure

```json
{
  "success": false,
  "data": null,
  "error": {
    "message": "Human-readable error",
    "details": {}
  }
}
```

- `data` is always `null` when `success` is `false`.
- `error.details` is optional (present for Zod validation failures).
- HTTP status codes reflect the error class (400, 401, 403, 404, 409, 500).

### Validation errors (400)

When request validation fails, `error.details` contains Zod issue objects:

```json
{
  "success": false,
  "data": null,
  "error": {
    "message": "Invalid request",
    "details": [
      {
        "code": "too_small",
        "path": ["name"],
        "message": "..."
      }
    ]
  }
}
```

---

## System routes

### `GET /health`

**Purpose:** Liveness check for the API process.

**Request:** None.

**Success (200):**

```json
{
  "success": true,
  "data": {
    "ok": true,
    "ts": "2026-06-02T12:00:00.000Z"
  },
  "error": null
}
```

**Failure:** Unhandled server errors use the global handler (500) with the failure envelope.

---

### `GET /__debug` (non-production only)

**Purpose:** Lists mounted API route prefixes. Not registered when `NODE_ENV=production`.

**Request:** None.

**Success (200):**

```json
{
  "success": true,
  "data": {
    "where": "src/app.ts",
    "mounts": [
      "/api/clinics",
      "/api/users",
      "/api/patients",
      "/api/pathways",
      "/api/enrollments",
      "/api/workflows"
    ],
    "ts": "2026-06-02T12:00:00.000Z"
  },
  "error": null
}
```

---

## Clinics — `/api/clinics`

### `GET /api/clinics`

**Purpose:** List all cancer clinics, newest first.

**Request:** None.

**Success (200):** `data` is an array of clinic objects:

```json
{
  "id": "string",
  "name": "string",
  "createdAt": "ISO-8601 datetime"
}
```

**Failure:** 500 on server error.

---

### `GET /api/clinics/:id`

**Purpose:** Get one clinic by ID.

**Params:** `id` — clinic ID.

**Success (200):** `data` is a single clinic object.

**Failure:**

| Status | `error.message` (typical) |
|--------|---------------------------|
| 400 | Invalid clinic id |
| 404 | Clinic not found |

---

### `POST /api/clinics`

**Purpose:** Create a clinic.

**Body:**

```json
{
  "name": "Lakeside Oncology Center"
}
```

| Field | Type | Required |
|-------|------|----------|
| `name` | string (min 1) | yes |

**Success (201):** `data` is the created clinic.

**Failure:** 400 validation; 500 server error.

---

### `PATCH /api/clinics/:id`

**Purpose:** Update clinic fields (currently `name` only).

**Params:** `id` — clinic ID.

**Body:** At least one field:

```json
{
  "name": "Lakeside Oncology Center"
}
```

**Success (200):** `data` is the updated clinic.

**Failure:** 400 empty body / validation; 404 clinic not found.

---

### `GET /api/clinics/:id/queue`

**Purpose:** List **ACTIVE** enrollments for patients at this clinic (same shape as workflow queue below).

**Params:** `id` — clinic ID.

**Success (200):** `data` is an array of queue entries:

```json
{
  "enrollmentId": "string",
  "status": "ACTIVE",
  "createdAt": "ISO-8601 datetime",
  "patientName": "Maria Garcia",
  "pathwayName": "Mastectomy recovery"
}
```

**Failure:** 400 invalid id; 500 server error.

> **Note:** Prefer `GET /api/workflows/clinics/:id/queue` for the clinic dashboard workflow; both endpoints return the same queue shape today.

---

## Pathways — `/api/pathways`

### `GET /api/pathways`

**Purpose:** List post-operative pathways, optionally filtered by clinic.

**Query:**

| Param | Type | Required |
|-------|------|----------|
| `clinicId` | string | no |

**Success (200):** `data` is an array of pathway objects:

```json
{
  "id": "string",
  "clinicId": "string",
  "name": "Mastectomy recovery",
  "createdAt": "ISO-8601 datetime"
}
```

---

### `GET /api/pathways/:id`

**Purpose:** Get one pathway.

**Success (200):** `data` is a pathway object.

**Failure:** 404 Pathway not found.

---

### `POST /api/pathways`

**Purpose:** Create a pathway for a clinic.

**Body:**

```json
{
  "clinicId": "string",
  "name": "Breast lumpectomy recovery"
}
```

**Success (201):** `data` is the created pathway.

**Failure:** 404 Clinic not found; 400 validation.

---

### `PATCH /api/pathways/:id`

**Purpose:** Update pathway `name`.

**Body:** `{ "name": "string" }` (at least one field).

**Success (200):** `data` is the updated pathway.

**Failure:** 404 Pathway not found; 400 validation.

---

## Users — `/api/users`

### `GET /api/users`

**Purpose:** List users (staff/patients), optionally by clinic.

**Query:** `clinicId` (optional).

**Success (200):** `data` is an array of user objects:

```json
{
  "id": "string",
  "clinicId": "string",
  "email": "user@example.com",
  "role": "PATIENT | CLINICIAN | ADMIN",
  "status": "INVITED | ACTIVE | DISABLED",
  "createdAt": "ISO-8601 datetime"
}
```

---

### `GET /api/users/:id`

**Purpose:** Get one user.

**Success (200):** `data` is a user object.

**Failure:** 404 User not found.

---

### `PATCH /api/users/:id`

**Purpose:** Update user email, role, or status.

**Body:** At least one of:

```json
{
  "email": "clinician@example.com",
  "role": "CLINICIAN",
  "status": "ACTIVE"
}
```

| Field | Values |
|-------|--------|
| `role` | `PATIENT`, `CLINICIAN`, `ADMIN` |
| `status` | `INVITED`, `ACTIVE`, `DISABLED` |

**Success (200):** `data` is the updated user.

**Failure:** 400 validation (e.g. invalid role); 404 User not found.

---

## Patients — `/api/patients`

### `POST /api/patients?clinicId={clinicId}`

**Purpose:** Create a patient and linked user (synthetic email) at a clinic.

**Query:** `clinicId` (required).

**Body:**

```json
{
  "firstName": "Maria",
  "lastName": "Garcia",
  "phone": "555-1001"
}
```

**Success (201):** `data` is a patient with nested `user`.

**Failure:** 400 validation / invalid clinic id.

---

### `GET /api/patients?clinicId={clinicId}`

**Purpose:** List patients for a clinic.

**Query:** `clinicId` (required).

**Success (200):** `data` is an array of patients (includes `user`).

---

### `GET /api/patients/:id`

**Purpose:** Get one patient.

**Success (200):** `data` is a patient with `user`.

**Failure:** 404 Patient not found.

---

### `PATCH /api/patients/:id`

**Purpose:** Update patient demographics.

**Body:** At least one of `firstName`, `lastName`, `phone`.

**Success (200):** `data` is the updated patient with `user`.

**Failure:** 404 Patient not found; 400 validation.

---

## Enrollments — `/api/enrollments`

There is no `POST` enrollment route; use `POST /api/workflows/onboard` to create enrollments.

### `GET /api/enrollments`

**Purpose:** List enrollments with patient and pathway included.

**Query (optional):** `patientId`, `clinicId`.

**Success (200):** `data` is an array of enrollment objects with nested `patient` and `pathway`.

---

### `GET /api/enrollments/:id`

**Purpose:** Get one enrollment.

**Success (200):** `data` includes `patient` and `pathway`.

**Failure:** 404 Enrollment not found.

---

### `PATCH /api/enrollments/:id`

**Purpose:** Update enrollment status.

**Body:**

```json
{
  "status": "ACTIVE"
}
```

| Status values |
|---------------|
| `ACTIVE`, `PAUSED`, `COMPLETED` |

**Success (200):** `data` is the updated enrollment with relations.

**Failure:** 404 Enrollment not found; 400 validation.

---

## Workflows — `/api/workflows`

High-level oncology clinic operations (onboard, queue, dashboard).

### `POST /api/workflows/onboard`

**Purpose:** Atomically create (or resolve) clinic, user, patient, and **ACTIVE** enrollment on a pathway.

**Body:**

```json
{
  "clinicId": "existing-clinic-id",
  "pathwayId": "pathway-id",
  "patient": {
    "email": "maria.garcia@example.com",
    "firstName": "Maria",
    "lastName": "Garcia",
    "phone": "555-1001"
  }
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `clinicId` | one of `clinicId` / `clinicName` | Use existing clinic |
| `clinicName` | one of `clinicId` / `clinicName` | Creates clinic if no `clinicId` |
| `pathwayId` | yes | Must belong to the clinic |
| `patient.email` | yes | Unique; stored lowercased |
| `patient.firstName` | yes | |
| `patient.lastName` | yes | |
| `patient.phone` | no | min 7 chars if provided |

**Success (201):**

```json
{
  "success": true,
  "data": {
    "clinic": { "id": "...", "name": "...", "createdAt": "..." },
    "user": { "id": "...", "email": "...", "role": "PATIENT", "status": "INVITED", ... },
    "patient": { "id": "...", "firstName": "Maria", "lastName": "Garcia", ... },
    "enrollment": {
      "id": "...",
      "status": "ACTIVE",
      "pathway": { "name": "Mastectomy recovery", ... },
      "patient": { ... }
    }
  },
  "error": null
}
```

**Failure:**

| Status | `error.message` (typical) |
|--------|---------------------------|
| 400 | Invalid request (validation) |
| 409 | A user with that email already exists |
| 500 | Clinic not found (missing `clinicId`) / server error |

---

### `GET /api/workflows/clinics/:id/queue`

**Purpose:** Clinic operations queue — **ACTIVE** enrollments only, oldest first.

**Params:** `id` — clinic ID.

**Success (200):** `data` is an array of queue entries (see clinic queue shape above). Empty array if none.

**Failure:** 400 invalid clinic id.

---

### `GET /api/workflows/patients/:id/dashboard`

**Purpose:** Patient chart view with user profile and all enrollments (with pathways).

**Params:** `id` — patient ID.

**Success (200):**

```json
{
  "success": true,
  "data": {
    "patient": {
      "id": "...",
      "firstName": "Maria",
      "lastName": "Garcia",
      "user": { "email": "...", "role": "PATIENT", ... },
      "enrollments": [ ... ]
    },
    "enrollments": [
      {
        "id": "...",
        "status": "ACTIVE",
        "pathway": { "name": "Mastectomy recovery", ... }
      }
    ]
  },
  "error": null
}
```

**Failure:** 404 Patient not found; 400 invalid patient id.

---

## Oncology workflow — `curl` examples

Set the API base once. Replace placeholder IDs with values from your database or seed (`npx prisma db seed`).

```bash
export API="http://localhost:3000"
```

### 1. List clinics

```bash
curl -s "$API/api/clinics" | jq .
```

Pick a clinic id from `data` (e.g. Lakeside Oncology Center after seeding).

```bash
export CLINIC_ID="<clinic-id-from-response>"
```

### 2. List queue for a clinic

```bash
curl -s "$API/api/workflows/clinics/$CLINIC_ID/queue" | jq .
```

Returns active enrollments (`patientName`, `pathwayName`, etc.) in `data`.

### 3. Onboard a patient

List pathways for the clinic to get `pathwayId`:

```bash
curl -s "$API/api/pathways?clinicId=$CLINIC_ID" | jq .
export PATHWAY_ID="<pathway-id-for-mastectomy-or-other>"
```

Onboard:

```bash
curl -s -X POST "$API/api/workflows/onboard" \
  -H "Content-Type: application/json" \
  -d "{
    \"clinicId\": \"$CLINIC_ID\",
    \"pathwayId\": \"$PATHWAY_ID\",
    \"patient\": {
      \"email\": \"new.patient@example.com\",
      \"firstName\": \"Ana\",
      \"lastName\": \"Lopez\",
      \"phone\": \"555-0199\"
    }
  }" | jq .
```

Save `data.patient.id` from the response.

```bash
export PATIENT_ID="<patient-id-from-onboard-response>"
```

### 4. View patient dashboard

```bash
curl -s "$API/api/workflows/patients/$PATIENT_ID/dashboard" | jq .
```

---

## CORS

The API allows browser requests from `http://localhost:5173` with credentials (for a future Vite frontend).

---

## Related docs

- Setup and commands: `core-skeleton/README.md`, `AGENTS.md`
- Roadmap phases: `core-skeleton/ROADMAP.md`
- Manual HTTP file: `core-skeleton/test-api.http`
