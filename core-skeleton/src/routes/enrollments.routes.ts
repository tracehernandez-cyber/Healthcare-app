import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import * as Enrollments from "../controllers/enrollments.controller";

export const enrollmentsRouter = Router();

enrollmentsRouter.get(
  "/",
  validate({
    query: z.object({
      patientId: z.string().min(1).optional(),
      clinicId: z.string().min(1).optional(),
    }),
  }),
  Enrollments.listEnrollments
);

enrollmentsRouter.get(
  "/:id",
  validate({
    params: z.object({
      id: z.string().min(1),
    }),
  }),
  Enrollments.getEnrollment
);

enrollmentsRouter.patch(
  "/:id",
  validate({
    params: z.object({
      id: z.string().min(1),
    }),
    body: z.object({
      status: z.enum(["ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"]).optional(),
    }).refine((b) => Object.keys(b).length > 0, { message: "No fields provided" }),
  }),
  Enrollments.updateEnrollment
);