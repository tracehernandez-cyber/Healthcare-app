import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ok, fail, paramValue } from "../lib/http";

export async function createPatient(req: Request, res: Response, next: NextFunction) {
  try {
    const clinicId = paramValue(req.query.clinicId);
    if (!clinicId) return fail(res, "Invalid clinic id", 400);
    const { firstName, lastName, phone } = req.body;

    const user = await prisma.user.create({
      data: {
        clinicId,
        email: `patient-${Date.now()}@example.com`,
        role: "PATIENT",
        status: "INVITED",
      },
    });

    const patient = await prisma.patient.create({
      data: {
        clinicId,
        userId: user.id,
        firstName,
        lastName,
        phone,
      },
      include: { user: true },
    });

    ok(res, patient, 201);
  } catch (err) {
    next(err);
  }
}

export async function listPatients(req: Request, res: Response, next: NextFunction) {
  try {
    const clinicId = paramValue(req.query.clinicId);
    if (!clinicId) return fail(res, "Invalid clinic id", 400);

    const patients = await prisma.patient.findMany({
      where: { clinicId },
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });

    ok(res, patients);
  } catch (err) {
    next(err);
  }
}

export async function getPatient(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramValue(req.params.id);
    if (!id) return fail(res, "Invalid patient id", 400);

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!patient) {
      return fail(res, "Patient not found", 404);
    }

    ok(res, patient);
  } catch (err) {
    next(err);
  }
}

export async function updatePatient(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramValue(req.params.id);
    if (!id) return fail(res, "Invalid patient id", 400);
    const { firstName, lastName, phone } = req.body;

    const updated = await prisma.patient.update({
      where: { id },
      data: { firstName, lastName, phone },
      include: { user: true },
    });

    ok(res, updated);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return fail(res, "Patient not found", 404);
    }

    next(err);
  }
}
