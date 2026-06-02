import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { ok, fail } from "./lib/http";
import { clinicsRouter } from "./routes/clinics.routes";
import { usersRouter } from "./routes/users.routes";
import { patientsRouter } from "./routes/patients.routes";
import { pathwaysRouter } from "./routes/pathways.routes";
import { enrollmentsRouter } from "./routes/enrollments.routes";
import { workflowsRouter } from "./routes/workflows.routes";

export const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  ok(res, { ok: true, ts: new Date().toISOString() });
});

if (process.env.NODE_ENV !== "production") {
  app.get("/__debug", (_req, res) => {
    ok(res, {
      where: "src/app.ts",
      mounts: [
        "/api/clinics",
        "/api/users",
        "/api/patients",
        "/api/pathways",
        "/api/enrollments",
        "/api/workflows",
      ],
      ts: new Date().toISOString(),
    });
  });
}

app.use("/api/clinics", clinicsRouter);
app.use("/api/users", usersRouter);
app.use("/api/patients", patientsRouter);
app.use("/api/pathways", pathwaysRouter);
app.use("/api/enrollments", enrollmentsRouter);
app.use("/api/workflows", workflowsRouter);

const clientDist = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../client/dist"
);
app.use(express.static(clientDist));
app.use((req, res, next) => {
  if (
    req.path.startsWith("/api") ||
    req.path === "/health" ||
    req.path === "/__debug"
  ) {
    return next();
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    return next();
  }
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) next();
  });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  const message = err instanceof Error ? err.message : "Server error";
  fail(res, message, 500);
});
