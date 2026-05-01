import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

export async function listPathways(req: Request, res: Response, next: NextFunction) {
  try {
    const { clinicId } = req.query as { clinicId?: string };

    const pathways = await prisma.pathway.findMany({
      where: clinicId ? { clinicId } : undefined,
      orderBy: { createdAt: "desc" },
    });

    res.json(pathways);
  } catch (err) {
    next(err);
  }
}

export async function getPathway(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const pathway = await prisma.pathway.findUnique({
      where: { id },
    });

    if (!pathway) {
      return res.status(404).json({ error: "Pathway not found" });
    }

    res.json(pathway);
  } catch (err) {
    next(err);
  }
}

export async function createPathway(req: Request, res: Response, next: NextFunction) {
  try {
    const { clinicId, name } = req.body;

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
    });

    if (!clinic) {
      return res.status(404).json({ error: "Clinic not found" });
    }

    const pathway = await prisma.pathway.create({
      data: {
        clinicId,
        name,
      },
    });

    res.status(201).json(pathway);
  } catch (err) {
    next(err);
  }
}

export async function updatePathway(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const updated = await prisma.pathway.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
      },
    });

    res.json(updated);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return res.status(404).json({ error: "Pathway not found" });
    }

    next(err);
  }
}