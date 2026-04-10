import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import * as Clinics from "../controllers/clinics.controller";

export const clinicsRouter = Router();

clinicsRouter.get("/", Clinics.listClinics);

clinicsRouter.get(
  "/:id",
  validate({
    params: z.object({
      id: z.string().min(1),
    }),
  }),
  Clinics.getClinic
);

clinicsRouter.post(
  "/",
  validate({
    body: z.object({
      name: z.string().min(1),
    }),
  }),
  Clinics.createClinic
);

clinicsRouter.patch(
  "/:id",
  validate({
    params: z.object({
      id: z.string().min(1),
    }),
    body: z
      .object({
        name: z.string().min(1).optional(),
      })
      .refine((b) => Object.keys(b).length > 0, {
        message: "No fields provided",
      }),
  }),
  Clinics.updateClinic
);

clinicsRouter.get(
  "/:id/queue",
  validate({
    params: z.object({
      id: z.string().min(1),
    }),
  }),
  Clinics.clinicQueue
);