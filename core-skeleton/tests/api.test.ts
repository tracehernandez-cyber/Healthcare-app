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
      expect(res.body).toMatchObject({
        success: true,
        error: null,
      });
      expect(res.body.data.ok).toBe(true);
      expect(res.body.data.ts).toBeDefined();
    });
  });

  // ── Clinic creation ───────────────────────────────────────
  describe("POST /api/clinics", () => {
    it("creates a clinic", async () => {
      const res = await request(app)
        .post("/api/clinics")
        .send({ name: `Test Clinic ${uid}` });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(`Test Clinic ${uid}`);
      expect(res.body.data.id).toBeDefined();
      clinicId = res.body.data.id;
    });

    it("rejects an empty name", async () => {
      const res = await request(app)
        .post("/api/clinics")
        .send({ name: "" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ── Pathway creation ──────────────────────────────────────
  describe("POST /api/pathways", () => {
    it("creates a pathway linked to the clinic", async () => {
      const res = await request(app)
        .post("/api/pathways")
        .send({ clinicId, name: "Hip Recovery" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({ clinicId, name: "Hip Recovery" });
      expect(res.body.data.id).toBeDefined();
      pathwayId = res.body.data.id;
    });

    it("returns 404 for a non-existent clinic", async () => {
      const res = await request(app)
        .post("/api/pathways")
        .send({ clinicId: "does-not-exist", name: "Nope" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/clinic not found/i);
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
      expect(res.body.success).toBe(true);

      const { clinic, user, patient, enrollment } = res.body.data;
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
      expect(res.body.success).toBe(false);
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
      expect(res.body.success).toBe(true);
      expect(res.body.data.patient.id).toBe(patientId);
      expect(res.body.data.patient.firstName).toBe("Alice");
      expect(res.body.data.enrollments).toHaveLength(1);
      expect(res.body.data.enrollments[0].pathway.name).toBe("Hip Recovery");
    });

    it("returns 404 for unknown patient", async () => {
      const res = await request(app).get(
        "/api/workflows/patients/nonexistent/dashboard"
      );
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ── Clinic queue ──────────────────────────────────────────
  describe("GET /api/workflows/clinics/:id/queue", () => {
    it("lists active enrollments for the clinic", async () => {
      const res = await request(app).get(
        `/api/workflows/clinics/${clinicId}/queue`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const entry = res.body.data.find(
        (e: { enrollmentId: string }) => e.enrollmentId === enrollmentId
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
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });
  });
});
