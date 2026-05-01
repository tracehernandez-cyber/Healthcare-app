import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

export async function listEnrollments(req: Request, res: Response, next: NextFunction) {
  try {
    const { patientId, clinicId } = req.query as any;

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

    res.json(enrollments);
  } catch (err) {
    next(err);
  }
}

export async function getEnrollment(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        patient: true,
        pathway: true,
      },
    });

    if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });
    res.json(enrollment);
  } catch (err) {
    next(err);
  }
}

export async function updateEnrollment(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
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

    res.json(updated);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return res.status(404).json({ error: "Enrollment not found" });
    }
    next(err);
  }
}
