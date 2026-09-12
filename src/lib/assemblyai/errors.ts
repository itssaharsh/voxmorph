/**
 * The Dictation API uses TWO error body shapes:
 *   { error, error_code }          — most errors
 *   { status, title, detail }      — relayed: 404 invalid key, 415 bad format
 * Read both, always.
 */
export type ErrorCode =
  | "bad_request" | "bad_audio" | "audio_too_large"
  | "capacity_exceeded" | "inference_timeout"
  | "invalid_key" | "unauthorized" | "network" | "timeout" | "unknown";

export class DictationError extends Error {
  status: number;
  code: ErrorCode;
  retryAfterMs?: number;
  constructor(message: string, status: number, code: ErrorCode, retryAfterMs?: number) {
    super(message);
    this.name = "DictationError";
    this.status = status;
    this.code = code;
    this.retryAfterMs = retryAfterMs;
  }
}

export function parseErrorBody(status: number, body: string): { message: string; code: ErrorCode } {
  let json: unknown;
  try { json = JSON.parse(body); } catch { json = null; }
  const o = (json ?? {}) as Record<string, unknown>;

  const message =
    (typeof o.error === "string" && o.error) ||
    (typeof o.detail === "string" && o.detail) ||
    (typeof o.title === "string" && o.title) ||
    body.slice(0, 200) ||
    `HTTP ${status}`;

  let code = (typeof o.error_code === "string" ? o.error_code : "unknown") as ErrorCode;
  // An invalid API key returns 404, not 401 — treat it as auth, never as a missing route.
  if (status === 404) code = "invalid_key";
  else if (status === 401) code = "unauthorized";
  else if (status === 415 && code === "unknown") code = "bad_audio";
  else if (status === 413 && code === "unknown") code = "audio_too_large";

  return { message, code };
}

/** 429/502/503/504 and transport errors are transient. 400/401/404/413/415 are not. */
export function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

/** `Retry-After` is legal as integer seconds OR an HTTP-date. Handle both. */
export function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const secs = Number(header);
  if (Number.isFinite(secs)) return Math.max(0, secs * 1000);
  const when = Date.parse(header);
  if (!Number.isNaN(when)) return Math.max(0, when - Date.now());
  return undefined;
}
