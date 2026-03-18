import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function onboard(req: Request, res: Response) {
  const { clinicId, clinicName, pathwayId, patient } = req.body;

  const result = await prisma.$transaction(async (tx) => {
    const clinic =
      clinicId
        ? await tx.clinic.findUnique({ where: { id: clinicId } })
        : await tx.clinic.create({ data: { name: clinicName } });

    if (!clinic) throw new Error("Clinic not found");

    // user is the patient login identity
    const user = await tx.user.create({
      data: {
        clinicId: clinic.id,
        email: patient.email.toLowerCase(),
        role: "PATIENT",
        status: "INVITED",
      },
    });

    const createdPatient = await tx.patient.create({
      data: {
        clinicId: clinic.id,
        userId: user.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        phone: patient.phone,
      },
    });

    const enrollment = await tx.enrollment.create({
      data: {
        patientId: createdPatient.id,
        pathwayId,
        status: "ACTIVE",
      },
      include: { pathway: true, patient: true },
    });

    return { clinic, user, patient: createdPatient, enrollment };
  });

  res.status(201).json(result);
}

export async function patientDashboard(req: Request, res: Response) {
  const { id } = req.params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      user: true,
      enrollments: {
        orderBy: { createdAt: "desc" },
        include: { pathway: true },
      },
    },
  });

  if (!patient) return res.status(404).json({ error: "Patient not found" });

  res.json({
    patient,
    enrollments: patient.enrollments,
  });
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

  res.json(queue.map(e => ({
    enrollmentId: e.id,
    status: e.status,
    createdAt: e.createdAt,
    patientName: `${e.patient.firstName ?? ""} ${e.patient.lastName ?? ""}`.trim(),
    pathwayName: e.pathway.name,
  })));
}


