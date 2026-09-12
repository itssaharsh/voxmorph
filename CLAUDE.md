# Voxmorph — agent ground truth

Speak once → the utterance is rewritten for 5 audiences via AssemblyAI Dictation
`llm_instruction`. No other LLM in the stack.

## AssemblyAI Dictation API — VERIFIED FACTS (do not re-derive; the original battle
## plan in docs/BATTLE-PLAN.md is WRONG on the three points marked ⚠)

- `POST https://dictation.assemblyai.com/v1/transcribe/live`
- Auth: `Authorization: <RAW_KEY>` — **no `Bearer`**. Invalid key → **404** (not 401).
- Body: `multipart/form-data`, exactly two parts, **`config` MUST precede `audio`**
  (server streams the body; audio-first is a silent 400). `config` is required even as `{}`.
- `audio` Content-Type: `audio/wav` or `audio/pcm` ONLY. 16-bit only. Max 120s.
  ⚠ **WebM/Opus/MP3/M4A/OGG → HTTP 415.** MediaRecorder output must be converted
  to 16 kHz mono 16-bit WAV **in the browser** (no ffmpeg here or on Vercel).
- For WAV, `sample_rate`/`channels` are read from the RIFF header and the config
  fields are IGNORED. Required only for raw PCM.

### config — these 6 fields exist, and no others
`sample_rate`, `channels`, `language_codes`, `stt_prompt` (≤6000 chars, describes the
situation, PREPENDED/additive), `keyterms_prompt` (**array of strings**, ≤100 terms /
8000 chars), `llm_instruction` (≤2048 chars, **REPLACES** the default cleanup).

⚠ **`conversation_context` does NOT exist on Dictation** — it belongs to the separate
Sync STT product. Unknown fields are silently forwarded and ignored.

Never send `llm_instruction: ""` — an empty string may replace the default cleanup with
nothing. Strip empty/undefined keys before `JSON.stringify`.

### Response 200
`{ text, words:[{text,confidence}], confidence, llm_response, llm_error,
   audio_duration_ms, session_id, request_time_ms, sync_time_ms }`

⚠ **`text` is VERBATIM** — fillers, stutters, everything. Never altered.
The **cleaned** text is `llm_response`. Cleanup runs **by default**: sending `config: {}`
with no `llm_instruction` returns the default cleanup in `llm_response`.
Docs' own example: text = `"um so can we uh move the the meeting to thursday i think
friday works better actually"` → llm_response = `"Can we move the meeting to Friday?
That works better."`

A failed rewrite is **not** a failed request: still 200, `llm_response: null`,
`llm_error: "timeout"|"error"`, `text` intact. Always fall back to `text`.
The rewrite has a 5-second internal deadline.

### Errors — two body shapes, read both
`{error, error_code}` (codes: bad_request, bad_audio, audio_too_large,
capacity_exceeded, inference_timeout) and `{status, title, detail}` (404 invalid key,
415 bad format).
Retryable: 429, 502, 503, 504 (429/503 may carry `Retry-After`).
Non-retryable: 400, 401, 404, 413, 415. HTTP client timeout: 90s.

### Pre-warm
`GET https://dictation.assemblyai.com/warm` — **GET, unauthenticated**. Measured 0.78s
cold. Returns `{"warm":"toasty"}`. (The battle plan wrongly says POST.)

### Languages (19)
`en es de fr it pt tr nl sv no da fi hi vi ar he ja ur zh`

### Writing an llm_instruction
Describe ONLY the transformation. Rules about output format, refusing to answer the
text, and handling already-clean input are enforced server-side — adding your own
wastes budget and can conflict. Never ask for JSON.
Good: `"Rewrite as a concise clinical chart note."`

### Prompt injection
The transcript is passed to the model as fenced data with instructions not to act on
it. Dictated commands are rewritten as speech, not carried out.

## Build rules
- **Never use `FormData` for the fan-out** — it is single-use, so one FormData sent to
  six parallel fetches makes five fail with an empty body. Hand-roll a replayable
  `Buffer` body (see `src/lib/assemblyai/multipart.ts`).
- One API route (`src/app/api/morph/route.ts`), Node runtime. Do not create
  `/api/transcribe` or `/api/warm` — a self-fetch between route handlers costs a
  round-trip and needs an absolute origin. Warm is the GET of the same route.
- Never base64 the audio. POST the raw WAV blob. Vercel body cap is 4.5 MB.
- Tailwind v4: keyframes live in `@theme`/`@keyframes` in globals.css, `ring` is 1px
  (use `ring-2`), default border color is `currentColor` (always state `border-slate-800`).
- Palette: bg `slate-950` / accent `amber-500` (#f59e0b). No purple gradients, no glow,
  no emoji icons (use lucide-react).
