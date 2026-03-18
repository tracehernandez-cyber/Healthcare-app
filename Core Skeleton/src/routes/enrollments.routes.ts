import { Router } from "express";

export const enrollmentsRouter = Router();

// GET /api/enrollments
enrollmentsRouter.get("/", (_req, res) => {
  res.json({ enrollments: [] });
});