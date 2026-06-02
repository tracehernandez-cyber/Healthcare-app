import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ok, fail, paramValue } from "../lib/http";

export async function listEnrollments(req: Request, res: Response, next: NextFunction) {
  try {
    const { patientId, clinicId } = req.query as {
      patientId?: string;
      clinicId?: string;
    };

    const enrollments = await prisma.enrollment.findMany({
      where: {
        ...(patientId ? { patientId } : {}),
        ...(clinicId ? { patient: { clinicId } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        patient: true,
        pathway: true,
      },
    });

    ok(res, enrollments);
  } catch (err) {
    next(err);
  }
}

export async function getEnrollment(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramValue(req.params.id);
    if (!id) return fail(res, "Invalid enrollment id", 400);

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        patient: true,
        pathway: true,
      },
    });

    if (!enrollment) {
      return fail(res, "Enrollment not found", 404);
    }

    ok(res, enrollment);
  } catch (err) {
    next(err);
  }
}

export async function updateEnrollment(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramValue(req.params.id);
    if (!id) return fail(res, "Invalid enrollment id", 400);
    const { status } = req.body;

    const updated = await prisma.enrollment.update({
      where: { id },
      data: {
        ...(status !== undefined ? { status } : {}),
      },
      include: {
        patient: true,
        pathway: true,
      },
    });

    ok(res, updated);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return fail(res, "Enrollment not found", 404);
    }

    next(err);
  }
}
