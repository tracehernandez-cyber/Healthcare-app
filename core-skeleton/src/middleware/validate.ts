import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodTypeAny } from "zod";
import { fail } from "../lib/http";

export function validate(schema: {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        schema.body.parse(req.body);
      }

      if (schema.query) {
        schema.query.parse(req.query);
      }

      if (schema.params) {
        schema.params.parse(req.params);
      }

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          data: null,
          error: "Invalid request",
          details: err.issues,
        });
      }

      console.error(err);
      return fail(res, "Invalid request", 400);
    }
  };
}