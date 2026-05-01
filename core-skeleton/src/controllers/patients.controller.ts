import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

export async function createPatient(req: Request, res: Response, next: NextFunction) {
  try {
    const { clinicId, userId, firstName, lastName, phone } = req.body;

    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic) {
      return res.status(404).json({ error: "Clinic not found" });
    }

    const patient = await prisma.patient.create({
      data: { clinicId, userId, firstName, lastName, phone },
      include: { user: true },
    });

    res.status(201).json(patient);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2003"
    ) {
      return res.status(400).json({ error: "Referenced user does not exist" });
    }
    next(err);
  }
}

export async function listPatients(req: Request, res: Response, next: NextFunction) {
  try {
    const { clinicId } = req.query as any;

    const patients = await prisma.patient.findMany({
      where: { clinicId },
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });

    res.json(patients);
  } catch (err) {
    next(err);
  }
}

export async function getPatient(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json(patient);
  } catch (err) {
    next(err);
  }
}

export async function updatePatient(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { firstName, lastName, phone } = req.body;

    const updated = await prisma.patient.update({
      where: { id },
      data: { firstName, lastName, phone },
      include: { user: true },
    });

    res.json(updated);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return res.status(404).json({ error: "Patient not found" });
    }
    next(err);
  }
}
