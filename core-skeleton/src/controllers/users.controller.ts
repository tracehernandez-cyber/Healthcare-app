import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function listUsers(req: Request, res: Response) {
  const { clinicId } = req.query as any;

  const users = await prisma.user.findMany({
    where: clinicId ? { clinicId } : undefined,
    orderBy: { createdAt: "desc" },
  });

  res.json(users);
}

export async function getUser(req: Request, res: Response) {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
}

export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const { email, role, status } = req.body;

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(email !== undefined ? { email: String(email).toLowerCase() } : {}),
      ...(role !== undefined ? { role } : {}),
      ...(status !== undefined ? { status } : {}),
    },
  });

  res.json(updated);
}