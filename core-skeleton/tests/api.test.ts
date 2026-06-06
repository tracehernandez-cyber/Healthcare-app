import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

const uid = Date.now().toString(36);

let clinicId: string;
let pathwayId: string;
let patientId: string;
let enrollmentId: string;
let userId: string;

function expectFailure(
  body: {
    success: boolean;
    data: unknown;
    error: { message: string; details?: unknown };
  },
  messagePattern?: RegExp
) {
  expect(body.success).toBe(false);
  expect(body.data).toBeNull();
  expect(body.error).toMatchObject({ message: expect.any(String) });
  if (messagePattern) {
    expect(body.error.message).toMatch(messagePattern);
  }
}

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
      expectFailure(res.body, /invalid request/i);
      expect(res.body.error.details).toBeDefined();
    });
  });

  // ── Pathway creation ──────────────────────────────────────
  describe("POST /api/pathways", () => {
    it("creates a pathway linked to the clinic", async () => {
      const res = await request(app)
        .post("/api/pathways")
        .send({ clinicId, name: "Mastectomy Recovery" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({ clinicId, name: "Mastectomy Recovery" });
      expect(res.body.data.id).toBeDefined();
      pathwayId = res.body.data.id;
    });

    it("returns 404 for a non-existent clinic", async () => {
      const res = await request(app)
        .post("/api/pathways")
        .send({ clinicId: "does-not-exist", name: "Nope" });

      expect(res.status).toBe(404);
      expectFailure(res.body, /clinic not found/i);
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

      userId = user.id;
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
      expectFailure(res.body, /already exists/i);
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
      expect(res.body.data.enrollments[0].pathway.name).toBe("Mastectomy Recovery");
    });

    it("returns 404 for unknown patient", async () => {
      const res = await request(app).get(
        "/api/workflows/patients/nonexistent/dashboard"
      );
      expect(res.status).toBe(404);
      expectFailure(res.body, /patient not found/i);
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
      expect(entry.patientId).toBe(patientId);
      expect(entry.patientName).toBe("Alice Smith");
      expect(entry.pathwayName).toBe("Mastectomy Recovery");
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

    // ── GET single-resource endpoints ─────────────────────────
  describe("GET single-resource endpoints", () => {
    describe("GET /api/clinics/:id", () => {
      it("returns a clinic by id", async () => {
        const res = await request(app).get(`/api/clinics/${clinicId}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.error).toBeNull();
        expect(res.body.data.id).toBe(clinicId);
        expect(res.body.data.name).toBe(`Test Clinic ${uid}`);
      });

      it("returns 404 for a missing clinic", async () => {
        const res = await request(app).get("/api/clinics/does-not-exist");

        expect(res.status).toBe(404);
        expectFailure(res.body, /clinic not found/i);
      });
    });

    describe("GET /api/patients/:id", () => {
      it("returns a patient by id", async () => {
        const res = await request(app).get(`/api/patients/${patientId}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.error).toBeNull();
        expect(res.body.data.id).toBe(patientId);
        expect(res.body.data.firstName).toBe("Alice");
        expect(res.body.data.lastName).toBe("Smith");
        expect(res.body.data.phone).toBe("555-1234");
      });

      it("returns 404 for a missing patient", async () => {
        const res = await request(app).get("/api/patients/does-not-exist");

        expect(res.status).toBe(404);
        expectFailure(res.body, /patient not found/i);
      });
    });

    describe("GET /api/users/:id", () => {
      it("returns a user by id", async () => {
        const res = await request(app).get(`/api/users/${userId}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.error).toBeNull();
        expect(res.body.data.id).toBe(userId);
        expect(res.body.data.email).toBe(`alice-${uid}@example.com`);
        expect(res.body.data.role).toBe("PATIENT");
      });

      it("returns 404 for a missing user", async () => {
        const res = await request(app).get("/api/users/does-not-exist");

        expect(res.status).toBe(404);
        expectFailure(res.body, /user not found/i);
      });
    });

    describe("GET /api/enrollments/:id", () => {
      it("returns an enrollment by id", async () => {
        const res = await request(app).get(`/api/enrollments/${enrollmentId}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.error).toBeNull();
        expect(res.body.data.id).toBe(enrollmentId);
        expect(res.body.data.patientId).toBe(patientId);
        expect(res.body.data.pathwayId).toBe(pathwayId);
        expect(res.body.data.status).toBe("ACTIVE");
      });

      it("returns 404 for a missing enrollment", async () => {
        const res = await request(app).get("/api/enrollments/does-not-exist");

        expect(res.status).toBe(404);
        expectFailure(res.body, /enrollment not found/i);
      });
    });
  });

    // ── PATCH endpoints ───────────────────────────────────────
  describe("PATCH endpoints", () => {
    describe("PATCH /api/clinics/:id", () => {
      it("updates a clinic name", async () => {
        const res = await request(app)
          .patch(`/api/clinics/${clinicId}`)
          .send({ name: `Updated Clinic ${uid}` });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.error).toBeNull();
        expect(res.body.data.id).toBe(clinicId);
        expect(res.body.data.name).toBe(`Updated Clinic ${uid}`);
      });

      it("returns 404 for a missing clinic", async () => {
        const res = await request(app)
          .patch("/api/clinics/does-not-exist")
          .send({ name: "Missing Clinic" });

        expect(res.status).toBe(404);
        expectFailure(res.body, /clinic not found/i);
      });

      it("rejects an empty PATCH body", async () => {
        const res = await request(app)
          .patch(`/api/clinics/${clinicId}`)
          .send({});

        expect(res.status).toBe(400);
        expectFailure(res.body, /invalid request|at least one field|required/i);
      });
    });

    describe("PATCH /api/pathways/:id", () => {
      it("updates a pathway name", async () => {
        const res = await request(app)
          .patch(`/api/pathways/${pathwayId}`)
          .send({ name: `Updated Pathway ${uid}` });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.error).toBeNull();
        expect(res.body.data.id).toBe(pathwayId);
        expect(res.body.data.name).toBe(`Updated Pathway ${uid}`);
      });

      it("returns 404 for a missing pathway", async () => {
        const res = await request(app)
          .patch("/api/pathways/does-not-exist")
          .send({ name: "Missing Pathway" });

        expect(res.status).toBe(404);
        expectFailure(res.body, /pathway not found/i);
      });

      it("rejects an empty PATCH body", async () => {
        const res = await request(app)
          .patch(`/api/pathways/${pathwayId}`)
          .send({});

        expect(res.status).toBe(400);
        expectFailure(res.body, /invalid request|at least one field|required/i);
      });
    });

    describe("PATCH /api/enrollments/:id", () => {
      it("updates enrollment status from ACTIVE to PAUSED", async () => {
        const res = await request(app)
          .patch(`/api/enrollments/${enrollmentId}`)
          .send({ status: "PAUSED" });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.error).toBeNull();
        expect(res.body.data.id).toBe(enrollmentId);
        expect(res.body.data.status).toBe("PAUSED");
      });

      it("updates enrollment status from PAUSED to COMPLETED", async () => {
        const res = await request(app)
          .patch(`/api/enrollments/${enrollmentId}`)
          .send({ status: "COMPLETED" });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.error).toBeNull();
        expect(res.body.data.id).toBe(enrollmentId);
        expect(res.body.data.status).toBe("COMPLETED");
      });

      it("rejects an invalid enrollment status", async () => {
        const res = await request(app)
          .patch(`/api/enrollments/${enrollmentId}`)
          .send({ status: "NOT_A_REAL_STATUS" });

        expect(res.status).toBe(400);
        expectFailure(res.body, /invalid request|invalid status/i);
      });

      it("returns 404 for a missing enrollment", async () => {
        const res = await request(app)
          .patch("/api/enrollments/does-not-exist")
          .send({ status: "PAUSED" });

        expect(res.status).toBe(404);
        expectFailure(res.body, /enrollment not found/i);
      });

      it("rejects an empty PATCH body", async () => {
        const res = await request(app)
          .patch(`/api/enrollments/${enrollmentId}`)
          .send({});

        expect(res.status).toBe(400);
        expectFailure(res.body, /invalid request|at least one field|required/i);
      });
    });

    describe("PATCH /api/users/:id", () => {
      it("updates user email, role, and status", async () => {
        const updatedEmail = `updated-alice-${uid}@example.com`;

        const res = await request(app)
          .patch(`/api/users/${userId}`)
          .send({
            email: updatedEmail,
            role: "ADMIN",
            status: "DISABLED",
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.error).toBeNull();
        expect(res.body.data.id).toBe(userId);
        expect(res.body.data.email).toBe(updatedEmail);
        expect(res.body.data.role).toBe("ADMIN");
        expect(res.body.data.status).toBe("DISABLED");
      });

      it("returns 404 for a missing user", async () => {
        const res = await request(app)
          .patch("/api/users/does-not-exist")
          .send({ email: `missing-${uid}@example.com` });

        expect(res.status).toBe(404);
        expectFailure(res.body, /user not found/i);
      });

      it("rejects invalid email format", async () => {
        const res = await request(app)
          .patch(`/api/users/${userId}`)
          .send({ email: "not-an-email" });

        expect(res.status).toBe(400);
        expectFailure(res.body, /invalid request|email/i);
      });

      it("rejects an empty PATCH body", async () => {
        const res = await request(app)
          .patch(`/api/users/${userId}`)
          .send({});

        expect(res.status).toBe(400);
        expectFailure(res.body, /invalid request|at least one field|required/i);
      });
    });

    describe("PATCH /api/patients/:id", () => {
      it("updates patient firstName, lastName, and phone", async () => {
        const res = await request(app)
          .patch(`/api/patients/${patientId}`)
          .send({
            firstName: "UpdatedAlice",
            lastName: "UpdatedSmith",
            phone: "555-9999",
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.error).toBeNull();
        expect(res.body.data.id).toBe(patientId);
        expect(res.body.data.firstName).toBe("UpdatedAlice");
        expect(res.body.data.lastName).toBe("UpdatedSmith");
        expect(res.body.data.phone).toBe("555-9999");
      });

      it("returns 404 for a missing patient", async () => {
        const res = await request(app)
          .patch("/api/patients/does-not-exist")
          .send({ firstName: "Missing" });

        expect(res.status).toBe(404);
        expectFailure(res.body, /patient not found/i);
      });

      it("rejects an empty PATCH body", async () => {
        const res = await request(app)
          .patch(`/api/patients/${patientId}`)
          .send({});

        expect(res.status).toBe(400);
        expectFailure(res.body, /invalid request|at least one field|required/i);
      });
    });
  });
});
