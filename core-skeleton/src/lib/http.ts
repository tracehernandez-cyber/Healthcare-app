import type { Response } from "express";

/** Normalize Express route/query params. */
export function paramValue(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : undefined;
  }
  return undefined;
}

export type ApiErrorBody = {
  message: string;
  details?: unknown;
};

export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({
    success: true,
    data,
    error: null,
  });
}

export function fail(
  res: Response,
  error: string | ApiErrorBody,
  status = 400
) {
  const errorBody: ApiErrorBody =
    typeof error === "string" ? { message: error } : error;

  return res.status(status).json({
    success: false,
    data: null,
    error: errorBody,
  });
}
