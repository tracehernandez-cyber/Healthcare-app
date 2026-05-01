import express from "express";
import cors from "cors";
import { clinicsRouter } from "./routes/clinics.routes";
import { usersRouter } from "./routes/users.routes";
import { patientsRouter } from "./routes/patients.routes";
import { pathwaysRouter } from "./routes/pathways.routes";
import { enrollmentsRouter } from "./routes/enrollments.routes";
import { workflowsRouter } from "./routes/workflows.routes";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.use("/api/clinics", clinicsRouter);
app.use("/api/users", usersRouter);
app.use("/api/patients", patientsRouter);
app.use("/api/pathways", pathwaysRouter);
app.use("/api/enrollments", enrollmentsRouter);
app.use("/api/workflows", workflowsRouter);

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ ok: false, error: err?.message ?? "Server error" });
});

