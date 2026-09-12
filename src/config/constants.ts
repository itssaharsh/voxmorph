/** Every timeout, limit and URL. No magic numbers anywhere else. */

export const DICTATION_HOST = "https://dictation.assemblyai.com";
export const TRANSCRIBE_PATH = "/v1/transcribe/live";
export const WARM_PATH = "/warm"; // GET, unauthenticated

/** Audio contract: 16 kHz mono 16-bit PCM in a RIFF/WAVE container. */
export const TARGET_SAMPLE_RATE = 16_000;
export const BYTES_PER_MS = (TARGET_SAMPLE_RATE * 1 * 16) / 8 / 1000; // 32
export const WAV_HEADER_BYTES = 44;

/** Hold-to-talk guards. Safari returns junk below ~300ms; the API caps at 120s. */
export const MIN_RECORD_MS = 300;
export const MAX_RECORD_MS = 110_000;

/** Vercel caps a request body at 4.5 MB; reject before the platform does. */
export const MAX_AUDIO_BYTES = 4 * 1024 * 1024;

/** Retry policy. Equal jitter — full jitter can return ~0ms and re-burst. */
export const MAX_ATTEMPTS = 3;
export const BASE_DELAY_MS = 400;
export const BACKOFF_FACTOR = 2.5;
export const RETRY_AFTER_CAP_MS = 10_000;

/** Fan-out. */
export const STAGGER_MS = 80;
export const ROUTE_DEADLINE_MS = 80_000; // < maxDuration (120)
export const LLM_RETRY_BUDGET = 2;       // cards retried for a soft llm_error
export const RATE_LIMIT_BREAKER = 2;     // 429/503 hits before retries stop
export const HEARTBEAT_MS = 10_000;

/** Per-call timeout scales with audio length. */
export const MIN_CALL_TIMEOUT_MS = 25_000;
export const MAX_CALL_TIMEOUT_MS = 90_000;

/** Below this, a word gets the amber dotted underline. */
export const LOW_CONFIDENCE = 0.7;

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "ja", label: "日本語" },
] as const;

/** All 19 the API accepts, for validation. */
export const ALL_LANGUAGE_CODES = ["en","es","de","fr","it","pt","tr","nl","sv","no","da","fi","hi","vi","ar","he","ja","ur","zh"] as const;

export const STT_PROMPT =
  "A short spoken work update that will be rewritten for several different audiences.";

export const KEYTERMS = [
  "AssemblyAI", "Voxmorph", "Kubernetes", "Postgres", "staging",
  "rollback", "p95", "latency", "deploy",
];
