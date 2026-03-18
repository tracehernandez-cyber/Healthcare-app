import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodTypeAny } from "zod";

console.log("LOADED validate.ts NEW");

export function validate(schema: {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log("validate hit", req.path);

    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
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
          error: "Invalid request",
          details: err.issues,
        });
      }

      return res.status(400).json({
        error: "Invalid request",
        details: String(err),
      });
    }
  };
}