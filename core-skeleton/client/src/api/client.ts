import type { ApiEnvelope, ApiErrorBody } from "./types";

const SERVER_UNREACHABLE =
  "Unable to reach the server. Please check that the API is running.";
const UNEXPECTED_RESPONSE = "Unexpected response from server.";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, error: ApiErrorBody) {
    super(error.message);
    this.name = "ApiError";
    this.status = status;
    this.details = error.details;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return isRecord(value) && typeof value.message === "string";
}

function isFailureEnvelope(
  value: unknown
): value is Extract<ApiEnvelope<unknown>, { success: false }> {
  return (
    isRecord(value) &&
    value.success === false &&
    value.data === null &&
    isApiErrorBody(value.error)
  );
}

function isSuccessEnvelope(
  value: unknown
): value is Extract<ApiEnvelope<unknown>, { success: true }> {
  return (
    isRecord(value) &&
    value.success === true &&
    value.error === null &&
    "data" in value
  );
}

function statusMessage(status: number): string {
  return `Request failed with status ${status}.`;
}

function parseJson(text: string): unknown | undefined {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return undefined;
  }
}

async function parseEnvelope<T>(res: Response): Promise<T> {
  let text: string;
  try {
    text = await res.text();
  } catch {
    if (!res.ok) throw new Error(statusMessage(res.status));
    throw new Error(UNEXPECTED_RESPONSE);
  }

  const trimmed = text.trim();

  if (!trimmed) {
    if (!res.ok) throw new Error(statusMessage(res.status));
    throw new Error(UNEXPECTED_RESPONSE);
  }

  const body = parseJson(text);

  if (body === undefined) {
    if (!res.ok) throw new Error(statusMessage(res.status));
    throw new Error(UNEXPECTED_RESPONSE);
  }

  if (body === null || !isRecord(body)) {
    if (!res.ok) throw new Error(statusMessage(res.status));
    throw new Error(UNEXPECTED_RESPONSE);
  }

  if (isFailureEnvelope(body)) {
    throw new ApiError(res.status, body.error);
  }

  if (isSuccessEnvelope(body)) {
    return body.data as T;
  }

  if (!res.ok) throw new Error(statusMessage(res.status));
  throw new Error(UNEXPECTED_RESPONSE);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    throw new Error(SERVER_UNREACHABLE);
  }
  return parseEnvelope<T>(res);
}

export async function apiGet<T>(path: string): Promise<T> {
  return request<T>(path);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function formatApiError(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}
