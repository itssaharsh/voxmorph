import {
  AUDIENCES, getAudience, WILDCARDS, BASELINE_ID,
  type Audience, type AudienceId,
} from "@/config/audiences";
import {
  MAX_AUDIO_BYTES, STAGGER_MS, ROUTE_DEADLINE_MS, LLM_RETRY_BUDGET,
  RATE_LIMIT_BREAKER, HEARTBEAT_MS, STT_PROMPT, KEYTERMS, ALL_LANGUAGE_CODES,
} from "@/config/constants";
import { transcribe, warm, type RetryGate } from "@/lib/assemblyai/client";
import { DictationError } from "@/lib/assemblyai/errors";
import { isRetryableStatus } from "@/lib/assemblyai/errors";
import { createSseWriter, SSE_HEADERS } from "@/lib/sse";
import { sleep } from "@/lib/retry";
import type { Card, DictationResponse, MorphEvent, MorphJson, Transcript } from "@/state/types";

/** Next 16: route handlers are uncached by default and `nodejs` is the default
 *  runtime (Edge is deprecated), so `runtime`/`dynamic`/`fetchCache` exports are
 *  unnecessary here. Only the duration needs raising for a 6-way upstream fan-out. */
export const maxDuration = 120;

/* ─────────────────────────── GET = pre-warm ───────────────────────────
 * Deliberately the GET of THIS route, not a separate /api/warm: on Vercel each
 * route handler is its own function, so warming a different path warms the wrong
 * one. This warms the lambda that is about to receive the audio, and the upstream
 * TLS session with it. */
export async function GET() {
  const r = await warm();
  return Response.json(
    { ok: r.ok, upstreamMs: r.ms },
    { headers: { "Cache-Control": "no-store" } }
  );
}

/* ─────────────────────────── helpers ─────────────────────────── */

type Job = { id: string; label: string; llm_instruction: string | null };

/** `?demo=fail` swaps one channel to this instruction so the relay and retry states
 *  can be filmed without waiting for a real 429 on camera.
 *
 *  The failure it produces is a REAL `llm_error` from the API, not a simulated one:
 *  asking for a thousand-word report overruns the rewrite's output cap whatever the
 *  audio says, so the service discards the result and returns llm_error "truncated".
 *  Measured 4 of 4 across two different clips. Content-demanding phrasings also
 *  truncate but only on audio that cannot satisfy them, which makes them useless
 *  once the demo clip changes; this one fails on output length, so it holds. */
const KNOWN_TRUNCATING_INSTRUCTION =
  "Expand this into a detailed thousand-word formal report with an executive summary, background section, methodology, findings, risk analysis, and appendix.";

function resolveJobs(param: string | null): Job[] {
  if (!param) return AUDIENCES.map((a: Audience) => ({ id: a.id, label: a.label, llm_instruction: a.llm_instruction }));
  const jobs: Job[] = [];
  for (const id of param.split(",").map((s) => s.trim()).filter(Boolean)) {
    const a = getAudience(id);
    if (a) { jobs.push({ id: a.id, label: a.label, llm_instruction: a.llm_instruction }); continue; }
    const w = WILDCARDS.find((x) => x.id === id);
    if (w) jobs.push({ id: w.id, label: w.label, llm_instruction: w.llm_instruction });
  }
  return jobs.length ? jobs : AUDIENCES.map((a) => ({ id: a.id, label: a.label, llm_instruction: a.llm_instruction }));
}

async function readAudio(req: Request): Promise<Buffer> {
  const ct = req.headers.get("content-type") ?? "";
  if (ct.startsWith("multipart/form-data")) {
    const fd = await req.formData();
    const f = fd.get("audio");
    if (!(f instanceof Blob)) throw new DictationError("no audio part", 400, "bad_request");
    return Buffer.from(await f.arrayBuffer());
  }
  return Buffer.from(await req.arrayBuffer());
}

function validateWav(audio: Buffer) {
  if (audio.length > MAX_AUDIO_BYTES)
    throw new DictationError("audio too large", 413, "audio_too_large");
  if (audio.length < 1024)
    throw new DictationError("audio too short", 400, "bad_audio");
  if (audio.toString("ascii", 0, 4) !== "RIFF" || audio.toString("ascii", 8, 12) !== "WAVE")
    throw new DictationError("audio must be a RIFF/WAVE container", 415, "bad_audio");
}

/** ANY non-null llm_error means the rewrite is not trustworthy.
 *  The docs list "timeout" | "error"; we have also observed "truncated", where
 *  llm_response came back non-null but cut off mid-sentence. */
const rewriteFailed = (r: DictationResponse) => r.llm_error !== null || r.llm_response === null;

/* ─────────────────────────── POST = fan-out ─────────────────────────── */

export async function POST(req: Request) {
  const url = new URL(req.url);
  const stream = url.searchParams.get("stream") !== "0";
  const langParam = url.searchParams.get("lang") ?? "en";
  const language = (ALL_LANGUAGE_CODES as readonly string[]).includes(langParam) ? langParam : "en";
  const jobs = resolveJobs(url.searchParams.get("audiences"));
  // Demo affordance: induce a genuine rewrite failure on one channel so the relay
  // and retry states can be filmed without waiting for a real 429 on camera.
  if (url.searchParams.get("demo") === "fail") {
    const target = jobs.find((j) => j.id === "tech") ?? jobs.find((j) => j.id !== BASELINE_ID);
    if (target) target.llm_instruction = KNOWN_TRUNCATING_INSTRUCTION;
  }
  const utteranceId = `u_${Date.now().toString(36)}`;

  let audio: Buffer;
  try {
    audio = await readAudio(req);
    validateWav(audio);
  } catch (e) {
    const err = e instanceof DictationError ? e : new DictationError("bad request", 400, "bad_request");
    return Response.json({ code: err.code, message: err.message, fatal: true }, { status: err.status });
  }
  if (!process.env.ASSEMBLYAI_API_KEY) {
    return Response.json(
      { code: "config", message: "ASSEMBLYAI_API_KEY is not set on the server", fatal: true },
      { status: 500 }
    );
  }

  const startedAt = Date.now();
  const deadlineAt = startedAt + ROUTE_DEADLINE_MS;

  // Shared across the fan-out: after repeated 429/503 we stop retrying entirely
  // rather than letting six independent retry loops turn a blip into a 40s hang.
  let rateLimitHits = 0;
  let llmRetriesUsed = 0;
  const gate: RetryGate = {
    allowRetry: () => rateLimitHits < RATE_LIMIT_BREAKER,
    noteRateLimit: () => { rateLimitHits++; },
    deadlineAt,
  };

  const config = (llm_instruction: string | null) => ({
    language_codes: [language],
    stt_prompt: STT_PROMPT,
    keyterms_prompt: KEYTERMS,
    llm_instruction,
  });

  /* Shared fan-out engine. `emit` either writes an SSE frame or collects for JSON. */
  async function run(emit: (e: MorphEvent) => void, signal: AbortSignal) {
    emit({ type: "meta", utteranceId, audiences: jobs.map((j) => j.id), audioBytes: audio.length, language });

    let transcriptSent = false;
    let baselineClean: string | null = null;
    const verbatims: string[] = [];
    // Cards that degraded to their own verbatim text before the baseline landed.
    const degradedToVerbatim = new Set<string>();
    const cards = new Map<string, Card>();

    const publishTranscript = (r: DictationResponse, clean: string | null) => {
      const t: Transcript = {
        verbatim: r.text,
        clean,
        words: r.words ?? [],
        confidence: r.confidence,
        audioDurationMs: r.audio_duration_ms,
        requestTimeMs: Math.round(r.request_time_ms ?? 0),
      };
      emit({ type: "transcript", utteranceId, transcript: t });
    };

    const publishCard = (card: Card) => {
      cards.set(card.id, card);
      emit({ type: "card", utteranceId, card });
    };

    const runJob = async (job: Job, index: number): Promise<void> => {
      await sleep(index * STAGGER_MS, signal).catch(() => {});
      const isBaseline = job.id === BASELINE_ID;

      try {
        const { response, attempts, ms } = await transcribe(audio, config(job.llm_instruction), gate, signal);
        verbatims.push(response.text);

        // The transcript panel is backed by ALL six responses — they carry the same
        // verbatim text — so it survives any five of six failing.
        if (isBaseline) {
          baselineClean = response.llm_response ?? null;
          publishTranscript(response, baselineClean);
          transcriptSent = true;
          // Upgrade any card that already degraded to raw verbatim text.
          if (baselineClean) {
            for (const id of degradedToVerbatim) {
              const c = cards.get(id);
              if (c) publishCard({ ...c, text: baselineClean, source: "baseline" });
            }
            degradedToVerbatim.clear();
          }
        } else if (!transcriptSent) {
          publishTranscript(response, null); // clean fills in when baseline lands
          transcriptSent = true;
        }

        if (!rewriteFailed(response)) {
          publishCard({
            id: job.id, label: job.label, status: "ok",
            text: isBaseline ? (response.llm_response ?? response.text) : response.llm_response!,
            source: "llm_response", llmError: null,
            requestTimeMs: ms, attempts,
          });
          return;
        }

        // 200 with a failed/untrustworthy rewrite is NOT a failed request.
        // Emit the degraded card immediately so the UI never waits, then retry once
        // in the background within a per-utterance budget.
        const fallback = baselineClean ?? response.text;
        const source = baselineClean ? "baseline" : "text";
        if (!baselineClean) degradedToVerbatim.add(job.id);

        const mayRetry = !isBaseline && llmRetriesUsed < LLM_RETRY_BUDGET && Date.now() < deadlineAt - 8_000;
        publishCard({
          id: job.id, label: job.label, status: "degraded",
          text: fallback, source, llmError: response.llm_error ?? "error",
          requestTimeMs: ms, attempts, retrying: mayRetry,
        });

        if (!mayRetry) return;
        llmRetriesUsed++;
        try {
          const second = await transcribe(audio, config(job.llm_instruction), gate, signal);
          if (!rewriteFailed(second.response)) {
            publishCard({
              id: job.id, label: job.label, status: "ok",
              text: second.response.llm_response!, source: "llm_response",
              llmError: null, requestTimeMs: second.ms, attempts: attempts + second.attempts,
            });
          } else {
            const c = cards.get(job.id);
            if (c) publishCard({ ...c, retrying: false });
          }
        } catch {
          const c = cards.get(job.id);
          if (c) publishCard({ ...c, retrying: false });
        }
      } catch (e) {
        const err = e instanceof DictationError ? e : new DictationError("request failed", 0, "unknown");
        publishCard({
          id: job.id, label: job.label, status: "failed",
          text: baselineClean, source: baselineClean ? "baseline" : null,
          llmError: null, requestTimeMs: null, attempts: 1,
          error: { code: err.code, message: err.message, retryable: isRetryableStatus(err.status) || err.status === 0 },
        });
      }
    };

    // allSettled, never all: one rejection must not unwind the stream.
    await Promise.allSettled(jobs.map((j, i) => runJob(j, i)));

    const list = [...cards.values()];
    emit({
      type: "done", utteranceId,
      ok: list.filter((c) => c.status === "ok").length,
      degraded: list.filter((c) => c.status === "degraded").length,
      failed: list.filter((c) => c.status === "failed").length,
      totalMs: Date.now() - startedAt,
      // Identical audio should yield identical verbatim text on every call.
      transcriptVariance: new Set(verbatims).size > 1,
    });
  }

  /* ── non-streaming sibling: identical payloads, replayed as the same events ── */
  if (!stream) {
    const ac = new AbortController();
    req.signal.addEventListener("abort", () => ac.abort(), { once: true });
    const collected: MorphEvent[] = [];
    await run((e) => collected.push(e), ac.signal);

    const cards = new Map<string, Card>();
    let transcript: Transcript | null = null;
    let summary: MorphJson["summary"] = { ok: 0, degraded: 0, failed: 0, totalMs: 0, transcriptVariance: false };
    for (const e of collected) {
      if (e.type === "card") cards.set(e.card.id, e.card);
      else if (e.type === "transcript") {
        // transcript may be emitted twice: once by whichever call lands first, then
        // again by the baseline carrying `clean`. Keep whichever clean text exists.
        const prevClean: string | null = transcript ? transcript.clean : null;
        transcript = { ...e.transcript, clean: e.transcript.clean ?? prevClean };
      }
      else if (e.type === "done") summary = { ok: e.ok, degraded: e.degraded, failed: e.failed, totalMs: e.totalMs, transcriptVariance: e.transcriptVariance };
    }
    const payload: MorphJson = {
      utteranceId,
      meta: { audiences: jobs.map((j) => j.id), audioBytes: audio.length, language },
      transcript,
      cards: jobs.map((j) => cards.get(j.id)).filter(Boolean) as Card[],
      summary,
    };
    return Response.json(payload, { headers: { "Cache-Control": "no-store" } });
  }

  /* ── SSE ── */
  const ac = new AbortController();
  req.signal.addEventListener("abort", () => ac.abort(), { once: true });

  const body = new ReadableStream<Uint8Array>({
    // NOT async: kick off a detached pump so the Response returns instantly.
    start(controller) {
      const sse = createSseWriter(controller);
      sse.open();
      const heartbeat = setInterval(() => sse.ping(), HEARTBEAT_MS);

      void (async () => {
        try {
          await run((e) => sse.send(e), ac.signal);
        } catch (e) {
          sse.send({
            type: "error",
            code: e instanceof DictationError ? e.code : "unknown",
            message: (e as Error)?.message ?? "morph failed",
            fatal: true,
          });
        } finally {
          clearInterval(heartbeat);
          sse.close();
        }
      })();
    },
  });

  return new Response(body, { headers: SSE_HEADERS });
}
