#!/usr/bin/env node
/**
 * Voxmorph transport smoke test — proves the AssemblyAI Dictation integration
 * end to end with no browser and no microphone.
 *
 *   node scripts/smoke.mjs [path/to.wav]
 *
 * Verifies: auth, multipart part ordering, WAV acceptance, response shape,
 * the text (verbatim) vs llm_response (rewritten) semantics, and the 6-way
 * parallel fan-out that the app performs per utterance.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DICTATION = "https://dictation.assemblyai.com";
const GATEWAY = "https://llm-gateway.assemblyai.com/v1/chat/completions";

// --- key: prefer the environment, fall back to .env.local so `npm run smoke` just works
function apiKey() {
  if (process.env.ASSEMBLYAI_API_KEY) return process.env.ASSEMBLYAI_API_KEY;
  try {
    const m = readFileSync(resolve(ROOT, ".env.local"), "utf8")
      .match(/^\s*ASSEMBLYAI_API_KEY\s*=\s*(.+?)\s*$/m);
    if (m) return m[1];
  } catch {}
  console.error("Set ASSEMBLYAI_API_KEY (env or .env.local).");
  process.exit(1);
}
const KEY = apiKey();
const redact = (s) => String(s).split(KEY).join("<KEY>");

const AUDIENCES = JSON.parse(readFileSync(resolve(ROOT, "src/config/audiences.json"), "utf8"));

/**
 * Hand-rolled multipart body. Deliberately NOT FormData:
 *  - a Buffer is replayable across all six concurrent calls and every retry,
 *    whereas a FormData body is single-use (five of six calls would send empty);
 *  - `config` must precede `audio` and here that ordering is explicit;
 *  - each part's Content-Type is stated outright, and the server 415s on format.
 */
function buildBody(config, audio, boundary) {
  const head = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="config"\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${JSON.stringify(config)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="audio"; filename="audio.wav"\r\n` +
    `Content-Type: audio/wav\r\n\r\n`
  );
  return Buffer.concat([head, audio, Buffer.from(`\r\n--${boundary}--\r\n`)]);
}

// Strip null/undefined/empty so we never send `llm_instruction: ""`, which would
// replace the default cleanup with nothing.
const clean = (o) => Object.fromEntries(
  Object.entries(o).filter(([, v]) => v !== null && v !== undefined && v !== "")
);

async function dictate(audio, config, label) {
  const boundary = `----voxmorph${Math.random().toString(16).slice(2)}`;
  const body = buildBody(clean(config), audio, boundary);
  const t0 = performance.now();
  const res = await fetch(`${DICTATION}/v1/transcribe/live`, {
    method: "POST",
    headers: {
      Authorization: KEY,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body,
    signal: AbortSignal.timeout(90_000),
  });
  const ms = Math.round(performance.now() - t0);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { label, status: res.status, ok: res.ok, ms, json, raw: text,
           retryAfter: res.headers.get("retry-after") };
}

const line = (c = "─") => console.log(c.repeat(76));

async function main() {
  const wavPath = process.argv[2] ?? resolve(ROOT, "fixtures/jfk.wav");
  const audio = readFileSync(wavPath);
  const sampleRate = audio.readUInt32LE(24);
  const channels = audio.readUInt16LE(22);
  const bits = audio.readUInt16LE(34);
  const durMs = Math.round((audio.length - 44) / (sampleRate * channels * bits / 8) * 1000);

  console.log(`\nVoxmorph smoke test`);
  line();
  console.log(`audio      ${wavPath}`);
  console.log(`format     ${sampleRate} Hz · ${channels}ch · ${bits}-bit · ${durMs} ms · ${audio.length} bytes`);
  console.log(`key        ${KEY.slice(0, 4)}…${KEY.slice(-2)} (${KEY.length} chars)`);

  // 1 ── pre-warm (GET, unauthenticated)
  line();
  const w0 = performance.now();
  const warm = await fetch(`${DICTATION}/warm`, { signal: AbortSignal.timeout(15_000) });
  console.log(`1. GET /warm            ${warm.status} ${await warm.text()} in ${Math.round(performance.now() - w0)}ms`);

  // 2 ── baseline: no llm_instruction at all → default cleanup
  const base = await dictate(audio, {
    language_codes: ["en"],
    stt_prompt: "A short spoken work update that will be rewritten for several audiences.",
  }, "baseline");

  console.log(`2. baseline (no llm_instruction)  HTTP ${base.status} in ${base.ms}ms`);
  if (!base.ok) { console.error(redact(base.raw)); process.exit(1); }
  const b = base.json;
  line();
  console.log(`   text        (VERBATIM) : ${JSON.stringify(b.text)}`);
  console.log(`   llm_response (CLEANED) : ${JSON.stringify(b.llm_response)}`);
  console.log(`   llm_error              : ${b.llm_error}`);
  console.log(`   confidence             : ${b.confidence}   words: ${b.words?.length}`);
  console.log(`   audio_duration_ms      : ${b.audio_duration_ms}`);
  console.log(`   request_time_ms        : ${b.request_time_ms}   sync_time_ms: ${b.sync_time_ms}`);
  console.log(`   session_id             : ${b.session_id}`);
  const lowConf = (b.words ?? []).filter((w) => w.confidence < 0.7);
  console.log(`   words < 0.7 confidence : ${lowConf.length}` +
    (lowConf.length ? ` → ${lowConf.slice(0, 6).map((w) => `${w.text}(${w.confidence})`).join(", ")}` : ""));

  const shape = ["text","words","confidence","llm_response","llm_error",
                 "audio_duration_ms","session_id","request_time_ms","sync_time_ms"];
  const missing = shape.filter((k) => !(k in b));
  console.log(`   response shape         : ${missing.length ? "MISSING " + missing.join(",") : "all 9 documented fields present"}`);
  console.log(`   text !== llm_response  : ${b.text !== b.llm_response ? "yes — cleanup ran" : "NO (identical)"}`);

  // 3 ── the real fan-out: all six, staggered 80ms, exactly as the route does it
  line();
  console.log(`3. fan-out — ${AUDIENCES.length} concurrent calls, staggered 80ms\n`);
  const t0 = performance.now();
  const results = await Promise.allSettled(AUDIENCES.map((a, i) =>
    new Promise((r) => setTimeout(r, i * 80)).then(() =>
      dictate(audio, {
        language_codes: ["en"],
        stt_prompt: "A short spoken work update that will be rewritten for several audiences.",
        llm_instruction: a.llm_instruction,
      }, a.id))
  ));
  const totalMs = Math.round(performance.now() - t0);

  const cards = [];
  for (const [i, r] of results.entries()) {
    const a = AUDIENCES[i];
    if (r.status === "rejected") { console.log(`   ${a.id.padEnd(9)} REJECTED ${redact(r.reason?.message)}`); continue; }
    const { status, ms, json, retryAfter } = r.value;
    if (status !== 200) {
      console.log(`   ${a.id.padEnd(9)} HTTP ${status}${retryAfter ? ` retry-after=${retryAfter}` : ""} ${redact(r.value.raw).slice(0, 120)}`);
      continue;
    }
    const out = json.llm_response ?? json.text;
    cards.push({ id: a.id, text: out, llm_error: json.llm_error, ms });
    console.log(`   ${a.id.padEnd(9)} ${String(ms).padStart(5)}ms  ${json.llm_error ? `[llm_error=${json.llm_error}] ` : ""}${JSON.stringify(out).slice(0, 150)}`);
  }

  // integrity: every response carries the same verbatim text
  const oks = results.filter((r) => r.status === "fulfilled" && r.value.status === 200).map((r) => r.value.json);
  const variance = new Set(oks.map((j) => j.text)).size;
  line();
  console.log(`   wall clock             : ${totalMs}ms for ${oks.length}/${AUDIENCES.length} successful`);
  console.log(`   transcriptVariance     : ${variance <= 1 ? "none — all responses agree on verbatim text" : `${variance} DISTINCT transcripts for identical audio`}`);
  console.log(`   rate limiting          : ${results.some((r) => r.status === "fulfilled" && [429, 503].includes(r.value.status)) ? "HIT 429/503" : "none observed"}`);

  // 4 ── LLM Gateway reachability (the fallback backend we did not build)
  line();
  const g0 = performance.now();
  const g = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 16, model_region: "global",
      messages: [{ role: "user", content: "Reply with the single word: ok" }] }),
    signal: AbortSignal.timeout(30_000),
  });
  const gTxt = await g.text();
  console.log(`4. LLM Gateway          HTTP ${g.status} in ${Math.round(performance.now() - g0)}ms`);
  console.log(`   ${redact(gTxt).slice(0, 300)}`);

  mkdirSync(resolve(ROOT, "fixtures"), { recursive: true });
  writeFileSync(resolve(ROOT, "fixtures/baseline.json"), JSON.stringify(b, null, 2));
  writeFileSync(resolve(ROOT, "fixtures/cards.json"), JSON.stringify(cards, null, 2));
  line();
  console.log(`saved fixtures/baseline.json + fixtures/cards.json\n`);
}

main().catch((e) => { console.error(redact(e?.stack ?? e)); process.exit(1); });
