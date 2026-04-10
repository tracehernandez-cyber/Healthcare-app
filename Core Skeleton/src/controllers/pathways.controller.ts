import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function listPathways(req: Request, res: Response) {
  const { clinicId } = req.query as { clinicId?: string };

  const pathways = await prisma.pathway.findMany({
    where: clinicId ? { clinicId } : undefined,
    orderBy: { createdAt: "desc" },
  });

  res.json(pathways);
}

export async function updatePathway(req: Request, res: Response) {
  const { id } = req.params;
  const { name } = req.body as { name?: string };

  const updated = await prisma.pathway.update({
    where: { id },
    data: { name },
  });

  res.json(updated);
}
