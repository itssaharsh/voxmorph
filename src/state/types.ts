import type { AudienceId } from "@/config/audiences";

export type WordConfidence = { text: string; confidence: number };

/** Exactly the documented 200 body. */
export type DictationResponse = {
  text: string;
  words: WordConfidence[];
  confidence: number;
  llm_response: string | null;
  /** Documented as "timeout" | "error" | null — we have also observed "truncated"
   *  in production, so treat ANY non-null value as degraded. */
  llm_error: string | null;
  audio_duration_ms: number;
  session_id: string;
  request_time_ms: number;
  sync_time_ms: number;
};

export type CardStatus = "pending" | "ok" | "degraded" | "failed";
/** Where the displayed text came from — drives the honesty chip on the card. */
export type CardSource = "llm_response" | "baseline" | "text" | null;

export type Card = {
  id: AudienceId | string;
  label: string;
  status: CardStatus;
  text: string | null;
  source: CardSource;
  llmError: string | null;
  requestTimeMs: number | null;
  attempts: number;
  retrying?: boolean;
  /** Set when the human gate was used — the user corrected the AI's output. */
  edited?: boolean;
  error?: { code: string; message: string; retryable: boolean };
};

export type Transcript = {
  verbatim: string;
  clean: string | null;
  words: WordConfidence[];
  confidence: number;
  audioDurationMs: number;
  requestTimeMs: number | null;
};

export type MorphEvent =
  | { type: "meta"; utteranceId: string; audiences: string[]; audioBytes: number; language: string }
  | { type: "transcript"; utteranceId: string; transcript: Transcript }
  | { type: "card"; utteranceId: string; card: Card }
  | { type: "done"; utteranceId: string; ok: number; degraded: number; failed: number; totalMs: number; transcriptVariance: boolean }
  | { type: "error"; code: string; message: string; fatal: boolean };

/** The non-streaming sibling. Field-for-field identical payloads, so the client can
 *  replay it as the same event sequence and there is ONE state-transition path. */
export type MorphJson = {
  utteranceId: string;
  meta: { audiences: string[]; audioBytes: number; language: string };
  transcript: Transcript | null;
  cards: Card[];
  summary: { ok: number; degraded: number; failed: number; totalMs: number; transcriptVariance: boolean };
};
