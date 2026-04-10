import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function listClinics(_req: Request, res: Response) {
  const clinics = await prisma.clinic.findMany({
    orderBy: { createdAt: "desc" },
  });

  res.json(clinics);
}

export async function getClinic(req: Request, res: Response) {
  const { id } = req.params;

  const clinic = await prisma.clinic.findUnique({
    where: { id },
  });

  if (!clinic) return res.status(404).json({ error: "Clinic not found" });

  res.json(clinic);
}

export async function createClinic(req: Request, res: Response) {
  const { name } = req.body;

  const clinic = await prisma.clinic.create({
    data: { name },
  });

  res.status(201).json(clinic);
}

export async function updateClinic(req: Request, res: Response) {
  const { id } = req.params;
  const { name } = req.body;

  const clinic = await prisma.clinic.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
    },
  });

  res.json(clinic);
}

export async function clinicQueue(req: Request, res: Response) {
  const { id: clinicId } = req.params;

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

  res.json(
    queue.map((e) => ({
      enrollmentId: e.id,
      status: e.status,
      createdAt: e.createdAt,
      patientName: `${e.patient.firstName ?? ""} ${e.patient.lastName ?? ""}`.trim(),
      pathwayName: e.pathway.name,
    }))
  );
}