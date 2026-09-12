import "server-only";
import {
  DICTATION_HOST, TRANSCRIBE_PATH, WARM_PATH, MAX_ATTEMPTS,
  BYTES_PER_MS, WAV_HEADER_BYTES, MIN_CALL_TIMEOUT_MS, MAX_CALL_TIMEOUT_MS,
} from "@/config/constants";
import { buildMultipartBody, newBoundary, type DictationConfig } from "./multipart";
import { DictationError, parseErrorBody, isRetryableStatus, parseRetryAfter } from "./errors";
import { backoffMs, clampRetryAfter, sleep, clamp } from "@/lib/retry";
import type { DictationResponse } from "@/state/types";

function apiKey(): string {
  const k = process.env.ASSEMBLYAI_API_KEY;
  if (!k) throw new DictationError("ASSEMBLYAI_API_KEY is not set", 500, "unknown");
  return k;
}

/** Timeout scales with audio length: 16 kHz mono 16-bit is 32 bytes per ms. */
export function callTimeoutFor(audioBytes: number): number {
  const audioMs = Math.max(0, (audioBytes - WAV_HEADER_BYTES) / BYTES_PER_MS);
  return clamp(Math.round(12_000 + 2 * audioMs), MIN_CALL_TIMEOUT_MS, MAX_CALL_TIMEOUT_MS);
}

/** GET /warm — unauthenticated, idempotent. Pays DNS+TCP+TLS before the audio call. */
export async function warm(): Promise<{ ok: boolean; ms: number }> {
  const t0 = performance.now();
  try {
    const res = await fetch(`${DICTATION_HOST}${WARM_PATH}`, {
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    return { ok: res.ok, ms: Math.round(performance.now() - t0) };
  } catch {
    return { ok: false, ms: Math.round(performance.now() - t0) };
  }
}

export type CallOutcome = {
  response: DictationResponse;
  attempts: number;
  ms: number;
};

export type RetryGate = {
  /** False once the circuit breaker has tripped on repeated 429/503. */
  allowRetry: () => boolean;
  noteRateLimit: () => void;
  /** Absolute ms timestamp after which we must stop and degrade. */
  deadlineAt: number;
};

/**
 * One Dictation call with bounded retries.
 * The `body` Buffer is built once and replayed across attempts.
 */
export async function transcribe(
  audio: Buffer,
  config: DictationConfig,
  gate: RetryGate,
  signal?: AbortSignal
): Promise<CallOutcome> {
  const timeout = callTimeoutFor(audio.length);
  const t0 = performance.now();
  let lastErr: DictationError | null = null;
  let abortRetried = false;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // One AbortController per attempt — an aborted controller is not reusable.
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeout);
    const onOuterAbort = () => ac.abort();
    signal?.addEventListener("abort", onOuterAbort, { once: true });

    const boundary = newBoundary();
    const attemptBody = buildMultipartBody(config, audio, boundary);

    try {
      const res = await fetch(`${DICTATION_HOST}${TRANSCRIBE_PATH}`, {
        method: "POST",
        headers: {
          Authorization: apiKey(),
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
        },
        body: new Uint8Array(attemptBody),
        signal: ac.signal,
        cache: "no-store",
      });

      if (res.ok) {
        const json = (await res.json()) as DictationResponse;
        return { response: json, attempts: attempt + 1, ms: Math.round(performance.now() - t0) };
      }

      const raw = await res.text();
      const { message, code } = parseErrorBody(res.status, raw);
      const retryAfterMs = clampRetryAfter(parseRetryAfter(res.headers.get("retry-after")));
      lastErr = new DictationError(message, res.status, code, retryAfterMs);

      if (res.status === 429 || res.status === 503) gate.noteRateLimit();
      if (!isRetryableStatus(res.status)) throw lastErr;
    } catch (e) {
      if (e instanceof DictationError) {
        if (!isRetryableStatus(e.status)) throw e;
        lastErr = e;
      } else if ((e as Error)?.name === "AbortError") {
        if (signal?.aborted) throw new DictationError("request aborted", 499, "timeout");
        // A hung socket is common; a genuinely slow request will not get faster.
        if (abortRetried) throw new DictationError(`timed out after ${timeout}ms`, 504, "timeout");
        abortRetried = true;
        lastErr = new DictationError(`timed out after ${timeout}ms`, 504, "timeout");
      } else {
        lastErr = new DictationError((e as Error)?.message ?? "network error", 0, "network");
      }
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onOuterAbort);
    }

    if (attempt === MAX_ATTEMPTS - 1) break;
    if (!gate.allowRetry()) break;

    const wait = lastErr?.retryAfterMs ?? backoffMs(attempt);
    // Never sleep past the route deadline — degrading at t+2s beats a card nobody
    // is still looking at at t+30s.
    if (Date.now() + wait + timeout / 2 > gate.deadlineAt) break;
    await sleep(wait, signal);
  }

  throw lastErr ?? new DictationError("request failed", 0, "unknown");
}
