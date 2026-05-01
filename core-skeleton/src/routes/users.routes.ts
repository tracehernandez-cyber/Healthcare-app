import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import * as Users from "../controllers/users.controller";

export const usersRouter = Router();

usersRouter.get(
  "/",
  validate({
    query: z.object({
      clinicId: z.string().min(1).optional(),
    }),
  }),
  Users.listUsers
);

usersRouter.get(
  "/:id",
  validate({
    params: z.object({
      id: z.string().min(1),
    }),
  }),
  Users.getUser
);

usersRouter.patch(
  "/:id",
  validate({
    params: z.object({
      id: z.string().min(1),
    }),
    body: z.object({
      email: z.string().email().optional(),
      role: z.enum(["PATIENT", "CLINICIAN", "ADMIN"]).optional(),
      status: z.enum(["INVITED", "ACTIVE", "DISABLED"]).optional(),
    }).refine((b) => Object.keys(b).length > 0, { message: "No fields provided" }),
  }),
  Users.updateUser
);