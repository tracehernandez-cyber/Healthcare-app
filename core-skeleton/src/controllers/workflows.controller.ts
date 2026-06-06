import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ok, fail, paramValue } from "../lib/http";

export async function onboard(req: Request, res: Response, next: NextFunction) {
  try {
    const { clinicId, clinicName, pathwayId, pathwayName, patient } = req.body;

    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        let clinic;
        let pathway;

        if (clinicId && pathwayId) {
          clinic = await tx.clinic.findUnique({
            where: { id: clinicId },
          });

          if (!clinic) {
            throw new Error("Clinic not found");
          }

          pathway = await tx.pathway.findFirst({
            where: {
              id: pathwayId,
              clinicId: clinic.id,
            },
          });

          if (!pathway) {
            throw new Error("Pathway not found");
          }
        } else if (clinicName && pathwayName) {
          clinic = await tx.clinic.create({
            data: { name: clinicName },
          });

          pathway = await tx.pathway.create({
            data: {
              clinicId: clinic.id,
              name: pathwayName,
            },
          });
        } else {
          throw new Error(
            "Provide either clinicId + pathwayId or clinicName + pathwayName",
          );
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
            pathwayId: pathway.id,
            status: "ACTIVE",
          },
          include: { pathway: true, patient: true },
        });

        return { clinic, pathway, user, patient: createdPatient, enrollment };
      },
    );

    ok(res, result, 201);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return fail(res, "A user with that email already exists", 409);
    }

    if (err instanceof Error && err.message === "Clinic not found") {
      return fail(res, "Clinic not found", 404);
    }

    if (err instanceof Error && err.message === "Pathway not found") {
      return fail(res, "Pathway not found", 404);
    }

    if (
      err instanceof Error &&
      err.message ===
        "Provide either clinicId + pathwayId or clinicName + pathwayName"
    ) {
      return fail(res, err.message, 400);
    }

    next(err);
  }
}

export async function patientDashboard(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = paramValue(req.params.id);
    if (!id) return fail(res, "Invalid patient id", 400);

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

    if (!patient) {
      return fail(res, "Patient not found", 404);
    }

    ok(res, {
      patient,
      enrollments: patient.enrollments,
    });
  } catch (err) {
    next(err);
  }
}

export async function clinicQueue(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const clinicId = paramValue(req.params.id);
    if (!clinicId) return fail(res, "Invalid clinic id", 400);

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

    ok(
      res,
      queue.map((e) => ({
        enrollmentId: e.id,
        patientId: e.patientId,
        status: e.status,
        createdAt: e.createdAt,
        patientName:
          `${e.patient.firstName ?? ""} ${e.patient.lastName ?? ""}`.trim(),
        pathwayName: e.pathway.name,
      })),
    );
  } catch (err) {
    next(err);
  }
}
