import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import * as Workflows from "../controllers/workflows.controller";

export const workflowsRouter = Router();

workflowsRouter.post(
  "/onboard",
  validate({
    body: z.object({
      clinicId: z.string().min(1).optional(),
      clinicName: z.string().min(1).optional(),
      pathwayId: z.string().min(1),
      patient: z.object({
        email: z.string().email(),
        firstName: z.string().min(1),
        lastName: z.string().min(1), // now required
        phone: z.string().min(7).optional(),
      }),
    }).refine(
      (b) => !!b.clinicId || !!b.clinicName,
      { message: "clinicId or clinicName required" }
    ),
  }),
  Workflows.onboard
);

workflowsRouter.get(
  "/patients/:id/dashboard",
  validate({
    params: z.object({
      id: z.string().min(1),
    }),
  }),
  Workflows.patientDashboard
);

workflowsRouter.get(
  "/clinics/:id/queue",
  validate({
    params: z.object({
      id: z.string().min(1),
    }),
  }),
  Workflows.clinicQueue
);