/**
 * Placeholder for future authentication.
 *
 * When auth is added, attach `req.user` (including `clinicId`) via middleware,
 * then use `requireClinicAccess` on routes that must be scoped to the caller's clinic.
 */
import type { Request, Response, NextFunction } from "express";
import { fail } from "../lib/http";

export function requireClinicAccess(
  getClinicIdFromReq: (req: Request) => string
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clinicId = getClinicIdFromReq(req);
    const userClinicId = (req as Request & { user?: { clinicId?: string } }).user
      ?.clinicId;

    if (!userClinicId) {
      return fail(res, "Unauthorized", 401);
    }

    if (clinicId !== userClinicId) {
      return fail(res, "Forbidden", 403);
    }

    next();
  };
}
