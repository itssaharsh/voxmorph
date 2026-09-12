#!/usr/bin/env node
/**
 * Generate the demo voiceover using AssemblyAI's Voice Agent API.
 *
 * AssemblyAI has no text-to-speech product, but the Voice Agent API speaks its
 * `greeting` verbatim at session start, which makes it usable as one. We open a
 * session per line, never send any input audio, capture the `reply.audio` chunks,
 * and write a WAV.
 *
 *   node scripts/make-voiceover.mjs [voice] [segmentId]
 *
 * Voices: alba eve george jane jean mary michael (US)
 *         anna charles paul vera (UK)
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const KEY = process.env.ASSEMBLYAI_API_KEY
  ?? readFileSync(".env.local", "utf8").match(/ASSEMBLYAI_API_KEY\s*=\s*(.+)/)[1].trim();

const VOICE = process.argv[2] ?? "george";
const ONLY = process.argv[3];
const RATE = 24_000; // Voice Agent output is PCM16 mono 24 kHz

/** Speech-ready copy. Written for the ear, so `llm_instruction` is spelled out
 *  rather than left as a token the model would try to pronounce. */
const SEGMENTS = [
  { id: "A",  at: "0:00", text:
    "You just left a meeting. Your boss needs the short version, your team needs the details, your users need none of the jargon, and your mum just wants to know if you're okay. That's the same update, written four times." },
  { id: "C1", at: "0:40", text:
    "That's exactly what I said. Ums and all. Channel zero is the verbatim transcript. The struck-out words are the ones AssemblyAI's own cleanup removed." },
  { id: "C2", at: "0:52", text:
    "There is no filler word list in my code. That diff is two fields from one API response, side by side." },
  { id: "C3", at: "1:02", text:
    "And every channel below it is the same fifteen seconds of audio, sent again with a different instruction. Your boss gets two sentences. Your team gets bullet points. Your family gets a sentence with no jargon in it at all." },
  { id: "D1", at: "1:20", text:
    "Nothing is re-recorded here. The audio is still in memory, so a new audience is just one more instruction against the same fifteen seconds." },
  { id: "D2", at: "1:32", text:
    "Pirate. Five-year-old. Haiku. Same recording every time, and the API writes each one from scratch." },
  { id: "D3", at: "1:44", text:
    "It's a joke until you realise it's the same mechanism. Every one of those is a plain English sentence describing a transformation. Nothing else." },
  { id: "E",  at: "1:56", text:
    "Six channels. Six separate L L M instructions. One API call each, and no other model anywhere in the stack. Voxmorph. Speak once, send everywhere." },
];

async function mintToken() {
  const r = await fetch(
    "https://agents.assemblyai.com/v1/token?expires_in_seconds=300&max_session_duration_seconds=600",
    { headers: { authorization: `Bearer ${KEY}` } }
  );
  if (!r.ok) throw new Error(`token ${r.status}: ${await r.text()}`);
  return (await r.json()).token;
}

function writeWav(pcmBuf, path) {
  const buf = Buffer.alloc(44 + pcmBuf.length);
  buf.write("RIFF", 0, "ascii");
  buf.writeUInt32LE(36 + pcmBuf.length, 4);
  buf.write("WAVE", 8, "ascii");
  buf.write("fmt ", 12, "ascii");
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(RATE, 24); buf.writeUInt32LE(RATE * 2, 28);
  buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36, "ascii"); buf.writeUInt32LE(pcmBuf.length, 40);
  pcmBuf.copy(buf, 44);
  writeFileSync(path, buf);
  return buf.length;
}

function speak(text, token) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`wss://agents.assemblyai.com/v1/ws?token=${encodeURIComponent(token)}`);
    const chunks = [];
    let spoken = "";
    const timer = setTimeout(() => { try { ws.close(); } catch {} reject(new Error("timed out")); }, 90_000);

    ws.addEventListener("open", () => {
      // Send session.update immediately; do not wait for session.ready.
      ws.send(JSON.stringify({
        type: "session.update",
        session: {
          system_prompt: "You are a narrator. Say nothing beyond your greeting. Never add commentary.",
          greeting: text,
          output: { voice: VOICE, format: { encoding: "audio/pcm" } },
        },
      }));
    });

    ws.addEventListener("message", (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch { return; }
      switch (m.type) {
        case "reply.audio":
          // NOTE: reply.audio carries bytes in `data`, not `audio`.
          if (m.data) chunks.push(Buffer.from(m.data, "base64"));
          break;
        case "transcript.agent":
          spoken = m.text ?? spoken;
          break;
        case "reply.done":
          clearTimeout(timer);
          try { ws.close(); } catch {}
          resolve({ pcm: Buffer.concat(chunks), spoken });
          break;
        case "session.error":
          clearTimeout(timer);
          try { ws.close(); } catch {}
          reject(new Error(m.message ?? "session.error"));
          break;
      }
    });

    ws.addEventListener("error", () => { clearTimeout(timer); reject(new Error("websocket error")); });
    ws.addEventListener("close", () => { clearTimeout(timer); if (chunks.length) resolve({ pcm: Buffer.concat(chunks), spoken }); });
  });
}

mkdirSync("voiceover", { recursive: true });
const targets = ONLY ? SEGMENTS.filter((s) => s.id === ONLY) : SEGMENTS;
console.log(`voice: ${VOICE}  segments: ${targets.map((t) => t.id).join(", ")}\n`);

for (const seg of targets) {
  process.stdout.write(`  ${seg.id.padEnd(3)} ${seg.at.padEnd(6)}`);
  try {
    const token = await mintToken();               // single-use, one per session
    const { pcm, spoken } = await speak(seg.text, token);
    if (!pcm.length) { console.log("no audio returned"); continue; }
    const path = `voiceover/${seg.id}.wav`;
    writeWav(pcm, path);
    const secs = pcm.length / 2 / RATE;
    console.log(`${secs.toFixed(1)}s  ${path}`);
    if (spoken && spoken.trim() !== seg.text.trim()) {
      console.log(`      note: agent said something other than the greeting`);
      console.log(`      got: ${JSON.stringify(spoken.slice(0, 110))}`);
    }
  } catch (e) {
    console.log(`FAILED: ${String(e.message).replace(KEY, "<KEY>")}`);
  }
}
