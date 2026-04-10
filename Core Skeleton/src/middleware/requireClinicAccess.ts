import type { Request, Response, NextFunction } from "express";
import { fail } from "../lib/http";

export function requireClinicAccess(
  getClinicIdFromReq: (req: Request) => string
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clinicId = getClinicIdFromReq(req);
    const userClinicId = (req as any).user?.clinicId;

    if (!userClinicId) {
      return fail(res, "Unauthorized", 401);
    }

    if (clinicId !== userClinicId) {
      return fail(res, "Forbidden", 403);
    }

    next();
  };
}