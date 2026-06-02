import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function createPatient(req: Request, res: Response) {
  const { clinicId } = req.query as { clinicId: string };
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

  res.status(201).json(patient);
}

export async function listPatients(req: Request, res: Response) {
  const { clinicId } = req.query as any;

  const patients = await prisma.patient.findMany({
    where: { clinicId },
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  res.json(patients);
}

export async function getPatient(req: Request, res: Response) {
  const { id } = req.params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!patient) return res.status(404).json({ error: "Patient not found" });
  res.json(patient);
}

export async function updatePatient(req: Request, res: Response) {
  const { id } = req.params;
  const { firstName, lastName, phone } = req.body;

  const updated = await prisma.patient.update({
    where: { id },
    data: { firstName, lastName, phone },
    include: { user: true },
  });

  res.json(updated);
}

