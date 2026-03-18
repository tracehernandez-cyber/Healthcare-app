import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import * as Patients from "../controllers/patients.controller";

export const patientsRouter = Router();

patientsRouter.get(
  "/",
  validate({ query: z.object({ clinicId: z.string().min(1) }) }),
  Patients.listPatients
);

patientsRouter.get(
  "/:id",
  validate({ params: z.object({ id: z.string().min(1) }) }),
  Patients.getPatient
);

patientsRouter.patch(
  "/:id",
  validate({
    params: z.object({ id: z.string().min(1) }),
    body: z.object({
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      phone: z.string().min(7).optional(),
    }).refine((b) => Object.keys(b).length > 0, { message: "No fields provided" })
  }),
  Patients.updatePatient
);

