import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

const uid = Date.now().toString(36);

let clinicId: string;
let pathwayId: string;
let patientId: string;
let enrollmentId: string;

describe("Healthcare API", () => {
  // ── Health ────────────────────────────────────────────────
  describe("GET /health", () => {
    it("returns ok", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ ok: true });
      expect(res.body.ts).toBeDefined();
    });
  });

  // ── Clinic creation ───────────────────────────────────────
  describe("POST /api/clinics", () => {
    it("creates a clinic", async () => {
      const res = await request(app)
        .post("/api/clinics")
        .send({ name: `Test Clinic ${uid}` });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe(`Test Clinic ${uid}`);
      expect(res.body.id).toBeDefined();
      clinicId = res.body.id;
    });

    it("rejects an empty name", async () => {
      const res = await request(app)
        .post("/api/clinics")
        .send({ name: "" });

      expect(res.status).toBe(400);
    });
  });

  // ── Pathway creation ──────────────────────────────────────
  describe("POST /api/pathways", () => {
    it("creates a pathway linked to the clinic", async () => {
      const res = await request(app)
        .post("/api/pathways")
        .send({ clinicId, name: "Hip Recovery" });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ clinicId, name: "Hip Recovery" });
      expect(res.body.id).toBeDefined();
      pathwayId = res.body.id;
    });

    it("returns 404 for a non-existent clinic", async () => {
      const res = await request(app)
        .post("/api/pathways")
        .send({ clinicId: "does-not-exist", name: "Nope" });

      expect(res.status).toBe(404);
    });
  });

  // ── Onboard workflow ──────────────────────────────────────
  describe("POST /api/workflows/onboard", () => {
    it("creates user + patient + enrollment in one call", async () => {
      const res = await request(app)
        .post("/api/workflows/onboard")
        .send({
          clinicId,
          pathwayId,
          patient: {
            email: `alice-${uid}@example.com`,
            firstName: "Alice",
            lastName: "Smith",
            phone: "555-1234",
          },
        });

      expect(res.status).toBe(201);

      const { clinic, user, patient, enrollment } = res.body;
      expect(clinic.id).toBe(clinicId);
      expect(user.email).toBe(`alice-${uid}@example.com`);
      expect(user.role).toBe("PATIENT");
      expect(patient.firstName).toBe("Alice");
      expect(patient.lastName).toBe("Smith");
      expect(enrollment.status).toBe("ACTIVE");
      expect(enrollment.pathwayId).toBe(pathwayId);

      patientId = patient.id;
      enrollmentId = enrollment.id;
    });

    it("rejects duplicate email", async () => {
      const res = await request(app)
        .post("/api/workflows/onboard")
        .send({
          clinicId,
          pathwayId,
          patient: {
            email: `alice-${uid}@example.com`,
            firstName: "Dup",
            lastName: "User",
          },
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already exists/i);
    });
  });

  // ── Patient dashboard ─────────────────────────────────────
  describe("GET /api/workflows/patients/:id/dashboard", () => {
    it("returns the patient with their enrollments", async () => {
      const res = await request(app).get(
        `/api/workflows/patients/${patientId}/dashboard`
      );

      expect(res.status).toBe(200);
      expect(res.body.patient.id).toBe(patientId);
      expect(res.body.patient.firstName).toBe("Alice");
      expect(res.body.enrollments).toHaveLength(1);
      expect(res.body.enrollments[0].pathway.name).toBe("Hip Recovery");
    });

    it("returns 404 for unknown patient", async () => {
      const res = await request(app).get(
        "/api/workflows/patients/nonexistent/dashboard"
      );
      expect(res.status).toBe(404);
    });
  });

  // ── Clinic queue ──────────────────────────────────────────
  describe("GET /api/workflows/clinics/:id/queue", () => {
    it("lists active enrollments for the clinic", async () => {
      const res = await request(app).get(
        `/api/workflows/clinics/${clinicId}/queue`
      );

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThanOrEqual(1);

      const entry = res.body.find(
        (e: any) => e.enrollmentId === enrollmentId
      );
      expect(entry).toBeDefined();
      expect(entry.patientName).toBe("Alice Smith");
      expect(entry.pathwayName).toBe("Hip Recovery");
      expect(entry.status).toBe("ACTIVE");
    });

    it("returns empty array for clinic with no enrollments", async () => {
      const res = await request(app).get(
        "/api/workflows/clinics/nonexistent/queue"
      );
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });
});
