import { Router } from "express";

export const usersRouter = Router();

// GET /api/users?clinicId=...
usersRouter.get("/", (req, res) => {
  res.json({ users: [], clinicId: req.query.clinicId ?? null });
});

// GET /api/users/:id
usersRouter.get("/:id", (req, res) => {
  res.json({ id: req.params.id });
});

// PATCH /api/users/:id
usersRouter.patch("/:id", (req, res) => {
  res.json({ id: req.params.id, updated: req.body });
});


