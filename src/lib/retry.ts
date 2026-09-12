import { BASE_DELAY_MS, BACKOFF_FACTOR, RETRY_AFTER_CAP_MS } from "@/config/constants";

/**
 * Equal jitter: delay/2 + random(delay/2).
 * Full jitter can return ~0ms, which re-bursts straight into the same capacity wall.
 */
export function backoffMs(attempt: number): number {
  const d = BASE_DELAY_MS * BACKOFF_FACTOR ** attempt;
  return Math.round(d / 2 + Math.random() * (d / 2));
}

export function clampRetryAfter(ms: number | undefined): number | undefined {
  if (ms === undefined) return undefined;
  return Math.min(ms, RETRY_AFTER_CAP_MS);
}

export const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new Error("aborted"));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => { clearTimeout(t); reject(new Error("aborted")); }, { once: true });
  });

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
