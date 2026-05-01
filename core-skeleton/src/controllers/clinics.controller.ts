import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

export async function listClinics(_req: Request, res: Response, next: NextFunction) {
  try {
    const clinics = await prisma.clinic.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(clinics);
  } catch (err) {
    next(err);
  }
}

export async function getClinic(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;

    const clinic = await prisma.clinic.findUnique({
      where: { id },
    });

    if (!clinic) {
      return res.status(404).json({ error: "Clinic not found" });
    }

    res.json(clinic);
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

    res.status(201).json(clinic);
  } catch (err) {
    next(err);
  }
}

export async function updateClinic(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { name } = req.body;

    const clinic = await prisma.clinic.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
      },
    });

    res.json(clinic);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return res.status(404).json({ error: "Clinic not found" });
    }

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