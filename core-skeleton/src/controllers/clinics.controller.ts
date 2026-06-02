import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ok, fail, paramValue } from "../lib/http";

export async function listClinics(_req: Request, res: Response, next: NextFunction) {
  try {
    const clinics = await prisma.clinic.findMany({
      orderBy: { createdAt: "desc" },
    });

    ok(res, clinics);
  } catch (err) {
    next(err);
  }
}

export async function getClinic(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramValue(req.params.id);
    if (!id) return fail(res, "Invalid clinic id", 400);

    const clinic = await prisma.clinic.findUnique({
      where: { id },
    });

    if (!clinic) {
      return fail(res, "Clinic not found", 404);
    }

    ok(res, clinic);
  } catch (err) {
    next(err);
  }
}

export async function createClinic(req: Request, res: Response, next: NextFunction) {
  try {
    const { name } = req.body;

    const clinic = await prisma.clinic.create({
      data: { name },
    });

    ok(res, clinic, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateClinic(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramValue(req.params.id);
    if (!id) return fail(res, "Invalid clinic id", 400);
    const { name } = req.body;

    const clinic = await prisma.clinic.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
      },
    });

    ok(res, clinic);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return fail(res, "Clinic not found", 404);
    }

    next(err);
  }
}

export async function clinicQueue(req: Request, res: Response, next: NextFunction) {
  try {
    const clinicId = paramValue(req.params.id);
    if (!clinicId) return fail(res, "Invalid clinic id", 400);

    const queue = await prisma.enrollment.findMany({
      where: {
        status: "ACTIVE",
        patient: { clinicId },
      },
      orderBy: { createdAt: "asc" },
      include: {
        patient: true,
        pathway: true,
      },
    });

    ok(
      res,
      queue.map((e) => ({
        enrollmentId: e.id,
        patientId: e.patientId,
        status: e.status,
        createdAt: e.createdAt,
        patientName: `${e.patient.firstName ?? ""} ${e.patient.lastName ?? ""}`.trim(),
        pathwayName: e.pathway.name,
      }))
    );
  } catch (err) {
    next(err);
  }
}
