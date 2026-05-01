import express from "express";
import { clinicsRouter } from "./routes/clinics.routes";
import { usersRouter } from "./routes/users.routes";
import { patientsRouter } from "./routes/patients.routes";
import { pathwaysRouter } from "./routes/pathways.routes";
import { enrollmentsRouter } from "./routes/enrollments.routes";
import { workflowsRouter } from "./routes/workflows.routes";

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.get("/__debug", (_req, res) => {
  res.json({
    ok: true,
    where: "src/app.ts",
    mounts: ["/api/clinics", "/api/users", "/api/patients", "/api/pathways", "/api/enrollments", "/api/workflows"],
    ts: new Date().toISOString(),
  });
});

app.use("/api/clinics", clinicsRouter);
app.use("/api/users", usersRouter);
console.log("USERS ROUTER STACK", usersRouter.stack?.map((l: any) => l.route?.path).filter(Boolean));
app.use("/api/patients", patientsRouter);
app.use("/api/pathways", pathwaysRouter);
app.use("/api/enrollments", enrollmentsRouter);
app.use("/api/workflows", workflowsRouter);

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ ok: false, error: err?.message ?? "Server error" });
});

