import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import * as Pathways from "../controllers/pathways.controller";

export const pathwaysRouter = Router();

pathwaysRouter.get(
  "/",
  validate({
    query: z.object({
      clinicId: z.string().min(1).optional(),
    }),
  }),
  Pathways.listPathways
);

pathwaysRouter.get(
  "/:id",
  validate({
    params: z.object({
      id: z.string().min(1),
    }),
  }),
  Pathways.getPathway
);

pathwaysRouter.post(
  "/",
  validate({
    body: z.object({
      clinicId: z.string().min(1),
      name: z.string().min(1),
    }),
  }),
  Pathways.createPathway
);

pathwaysRouter.patch(
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
  Pathways.updatePathway
);