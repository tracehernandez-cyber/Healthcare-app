import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { clinicId } = req.query as any;

    const users = await prisma.user.findMany({
      where: clinicId ? { clinicId } : undefined,
      orderBy: { createdAt: "desc" },
    });

    res.json(users);
  } catch (err) {
    next(err);
  }
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
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
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return res.status(404).json({ error: "User not found" });
    }
    next(err);
  }
}
