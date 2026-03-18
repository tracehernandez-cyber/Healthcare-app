import type { Request, Response, NextFunction } from "express";

export function requireClinicAccess(getClinicIdFromReq: (req: Request) => string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clinicId = getClinicIdFromReq(req);
    const userClinicId = (req as any).user?.clinicId;

    if (!userClinicId) return res.status(401).json({ error: "Unauthorized" });
    if (clinicId !== userClinicId) return res.status(403).json({ error: "Forbidden (wrong clinic)" });

    next();
  };
}


