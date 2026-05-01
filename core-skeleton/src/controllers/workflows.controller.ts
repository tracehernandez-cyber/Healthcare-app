import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

export async function onboard(req: Request, res: Response, next: NextFunction) {
  try {
    const { clinicId, clinicName, pathwayId, patient } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const clinic = clinicId
        ? await tx.clinic.findUnique({ where: { id: clinicId } })
        : await tx.clinic.create({ data: { name: clinicName } });

      if (!clinic) {
        throw new Error("Clinic not found");
      }

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
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return res.status(409).json({
        error: "A user with that email already exists",
      });
    }

    next(err);
  }
}

export async function patientDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        user: true,
        enrollments: {
          orderBy: { createdAt: "desc" },
          include: { pathway: true },
        },
      },
    }) as any;

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.json({
      patient,
      enrollments: patient.enrollments,
    });
  } catch (err) {
    next(err);
  }
}

export async function clinicQueue(req: Request, res: Response, next: NextFunction) {
  try {
    const clinicId = req.params.id as string;

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
    }) as any[];

    res.json(
      queue.map((e) => ({
        enrollmentId: e.id,
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