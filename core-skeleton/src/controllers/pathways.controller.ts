import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ok, fail, paramValue } from "../lib/http";

export async function listPathways(req: Request, res: Response, next: NextFunction) {
  try {
    const { clinicId } = req.query as { clinicId?: string };

    const pathways = await prisma.pathway.findMany({
      where: clinicId ? { clinicId } : undefined,
      orderBy: { createdAt: "desc" },
    });

    ok(res, pathways);
  } catch (err) {
    next(err);
  }
}

export async function getPathway(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramValue(req.params.id);
    if (!id) return fail(res, "Invalid pathway id", 400);

    const pathway = await prisma.pathway.findUnique({
      where: { id },
    });

    if (!pathway) {
      return fail(res, "Pathway not found", 404);
    }

    ok(res, pathway);
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
      return fail(res, "Clinic not found", 404);
    }

    const pathway = await prisma.pathway.create({
      data: {
        clinicId,
        name,
      },
    });

    ok(res, pathway, 201);
  } catch (err) {
    next(err);
  }
}

export async function updatePathway(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramValue(req.params.id);
    if (!id) return fail(res, "Invalid pathway id", 400);
    const { name } = req.body;

    const updated = await prisma.pathway.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
      },
    });

    ok(res, updated);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return fail(res, "Pathway not found", 404);
    }

    next(err);
  }
}
