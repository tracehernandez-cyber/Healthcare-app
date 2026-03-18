import { Router } from "express";

export const pathwaysRouter = Router();

// GET /api/pathways
pathwaysRouter.get("/", (_req, res) => {
  res.json({ pathways: [] });
});

