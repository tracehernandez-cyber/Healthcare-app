import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function listEnrollments(req: Request, res: Response) {
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
}

export async function getEnrollment(req: Request, res: Response) {
  const { id } = req.params;

  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
    include: {
      patient: true,
      pathway: true,
    },
  });

  if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });
  res.json(enrollment);
}

export async function updateEnrollment(req: Request, res: Response) {
  const { id } = req.params;
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
}