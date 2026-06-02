#!/usr/bin/env bash
# Manual API smoke test — requires dev server: npm run dev (http://localhost:3000)
# and seeded DB: npx prisma db seed
set -euo pipefail

API="${API_BASE_URL:-http://localhost:3000}"
SEED_CLINIC_NAME="Lakeside Oncology Center"
SEED_PATIENT_EMAIL="maria.garcia@example.com"

pass() { echo "PASS: $*"; }
fail() { echo "FAIL: $*" >&2; exit 1; }

require_jq() {
  command -v jq >/dev/null 2>&1 || fail "jq is required for smoke:api"
}

http_get() {
  local path="$1"
  local body code
  body="$(curl -sS -w "\n%{http_code}" "$API$path" 2>/dev/null)" || fail "GET $path failed (is the dev server running on $API?)"
  code="$(echo "$body" | tail -n1)"
  body="$(echo "$body" | sed '$d')"
  [[ "$code" =~ ^2 ]] || fail "GET $path returned HTTP $code"
  echo "$body"
}

assert_success() {
  local json="$1"
  local label="$2"
  echo "$json" | jq -e '.success == true' >/dev/null 2>&1 || {
    echo "$json" | jq . >&2 || true
    fail "$label — expected success: true"
  }
}

assert_failure_null_data() {
  local json="$1"
  local label="$2"
  echo "$json" | jq -e '.success == false and .data == null and (.error.message | type) == "string"' >/dev/null 2>&1 || {
    echo "$json" | jq . >&2 || true
    fail "$label — expected failure envelope with error.message"
  }
}

main() {
  require_jq
  echo "API smoke test → $API"
  echo ""

  # /health
  local health
  health="$(http_get "/health")"
  assert_success "$health" "/health"
  echo "$health" | jq -e '.data.ok == true' >/dev/null || fail "/health — missing data.ok"
  pass "GET /health"

  # GET /api/clinics (seeded)
  local clinics
  clinics="$(http_get "/api/clinics")"
  assert_success "$clinics" "GET /api/clinics"
  local clinic_id
  clinic_id="$(echo "$clinics" | jq -r --arg n "$SEED_CLINIC_NAME" '.data[] | select(.name == $n) | .id' | head -n1)"
  if [[ -z "$clinic_id" || "$clinic_id" == "null" ]]; then
    echo "$clinics" | jq '.data[].name' >&2 || true
    fail "Seeded clinic not found: $SEED_CLINIC_NAME (run: npx prisma db seed)"
  fi
  pass "GET /api/clinics (found $SEED_CLINIC_NAME)"

  # Clinic queue (workflow)
  local queue
  queue="$(http_get "/api/workflows/clinics/${clinic_id}/queue")"
  assert_success "$queue" "GET /api/workflows/clinics/:id/queue"
  local queue_len
  queue_len="$(echo "$queue" | jq '.data | length')"
  if [[ "$queue_len" -lt 1 ]]; then
    fail "Queue empty for $SEED_CLINIC_NAME — expected ACTIVE enrollments (run: npx prisma db seed)"
  fi
  pass "GET /api/workflows/clinics/:id/queue ($queue_len ACTIVE item(s))"
  echo "$queue" | jq -e '.data[0].patientId != null and (.data[0].patientId | type) == "string"' >/dev/null \
    || fail "Queue entries must include patientId"
  pass "Queue rows include patientId"

  # Patient dashboard (seeded Maria Garcia)
  local patients
  patients="$(http_get "/api/patients?clinicId=${clinic_id}")"
  assert_success "$patients" "GET /api/patients?clinicId="
  local patient_id
  patient_id="$(echo "$patients" | jq -r --arg e "$SEED_PATIENT_EMAIL" '.data[] | select(.user.email == $e) | .id' | head -n1)"
  if [[ -z "$patient_id" || "$patient_id" == "null" ]]; then
    fail "Seeded patient not found: $SEED_PATIENT_EMAIL (run: npx prisma db seed)"
  fi
  local dashboard
  dashboard="$(http_get "/api/workflows/patients/${patient_id}/dashboard")"
  assert_success "$dashboard" "GET /api/workflows/patients/:id/dashboard"
  echo "$dashboard" | jq -e '.data.patient.firstName == "Maria"' >/dev/null || fail "Dashboard patient mismatch"
  pass "GET /api/workflows/patients/:id/dashboard (Maria Garcia)"

  # Validation error shape (empty clinic name)
  local bad
  bad="$(curl -sS -X POST "$API/api/clinics" \
    -H "Content-Type: application/json" \
    -d '{"name":""}' || true)"
  assert_failure_null_data "$bad" "POST /api/clinics invalid body"
  echo "$bad" | jq -e '.error.details != null' >/dev/null || fail "Expected error.details on validation failure"
  pass "POST /api/clinics validation error envelope"

  echo ""
  echo "All smoke checks passed."
}

main "$@"
