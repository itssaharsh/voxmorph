import { TARGET_SAMPLE_RATE, WAV_HEADER_BYTES } from "@/config/constants";

/* Browser-side conversion to 16 kHz mono 16-bit WAV.
 *
 * Mandatory, not optional: the Dictation API accepts only audio/wav or audio/pcm
 * and rejects every MediaRecorder container (WebM/Opus on Chrome & Firefox,
 * MP4/AAC on Safari) with HTTP 415. There is no ffmpeg on a serverless host, so
 * the conversion happens here.
 *
 * The trick that makes this ~60 lines instead of ~180: decodeAudioData resamples
 * its result to the *context's* sample rate, so decoding into a 16 kHz
 * OfflineAudioContext gives us the downsample for free, using the browser's own
 * polyphase resampler. Hand-rolled linear interpolation would alias high
 * frequencies down into the speech band and make transcription worse.
 *
 * It also avoids the AudioWorklet path's landmine: Firefox before 148 throws at
 * createMediaStreamSource when the context rate differs from the mic rate.
 */

type AnyWindow = Window & {
  OfflineAudioContext?: typeof OfflineAudioContext;
  webkitOfflineAudioContext?: typeof OfflineAudioContext;
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

function OfflineCtor(): typeof OfflineAudioContext {
  const w = window as AnyWindow;
  const C = w.OfflineAudioContext ?? w.webkitOfflineAudioContext;
  if (!C) throw new Error("OfflineAudioContext is unavailable in this browser");
  return C;
}

export function AudioCtxCtor(): typeof AudioContext {
  const w = window as AnyWindow;
  const C = w.AudioContext ?? w.webkitAudioContext;
  if (!C) throw new Error("Web Audio is unavailable in this browser");
  return C;
}

/** Pick a container this browser can both record and decode. */
export function pickMimeType(): string {
  const prefs = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  for (const m of prefs) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(m)) return m;
  }
  return ""; // let the UA choose
}

/** Float −1..1 → signed 16-bit. The asymmetric scale is deliberate: Int16 spans
 *  −32768..32767, so negatives scale by 0x8000 and positives by 0x7FFF. */
export function floatTo16BitPCM(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

/**
 * Canonical 44-byte RIFF/WAVE header followed by little-endian PCM.
 *  0 "RIFF" · 4 u32 36+dataSize · 8 "WAVE" · 12 "fmt " · 16 u32 16 · 20 u16 1 (PCM)
 *  22 u16 channels · 24 u32 sampleRate · 28 u32 byteRate · 32 u16 blockAlign
 *  34 u16 bitsPerSample · 36 "data" · 40 u32 dataSize · 44 samples
 */
export function encodeWav(pcm: Int16Array, sampleRate: number, channels = 1): Blob {
  const bytesPerSample = 2;
  const dataSize = pcm.length * bytesPerSample;
  const buffer = new ArrayBuffer(WAV_HEADER_BYTES + dataSize);
  const view = new DataView(buffer);
  const ascii = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };

  ascii(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * bytesPerSample, true);
  view.setUint16(32, channels * bytesPerSample, true);
  view.setUint16(34, 16, true);
  ascii(36, "data");
  view.setUint32(40, dataSize, true);
  // 44 is 2-byte aligned, so a typed-array view beats a per-sample DataView loop.
  new Int16Array(buffer, WAV_HEADER_BYTES).set(pcm);

  return new Blob([buffer], { type: "audio/wav" });
}

/** Average all channels into one. */
function downmix(buf: AudioBuffer): Float32Array {
  if (buf.numberOfChannels === 1) return buf.getChannelData(0);
  const out = new Float32Array(buf.length);
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const ch = buf.getChannelData(c);
    for (let i = 0; i < buf.length; i++) out[i] += ch[i] / buf.numberOfChannels;
  }
  return out;
}

/** Fallback resample through the browser's own resampler, if a UA ignored the
 *  decode context's rate. */
async function resample(input: Float32Array, from: number, to: number): Promise<Float32Array> {
  if (from === to) return input;
  const frames = Math.max(1, Math.ceil((input.length * to) / from));
  const ctx = new (OfflineCtor())(1, frames, to);
  const b = ctx.createBuffer(1, input.length, from);
  b.copyToChannel(new Float32Array(input), 0); // fresh ArrayBuffer-backed copy
  const src = ctx.createBufferSource();
  src.buffer = b;
  src.connect(ctx.destination);
  src.start();
  const rendered = await ctx.startRendering();
  return rendered.getChannelData(0).slice();
}

/**
 * The whole conversion. Takes whatever MediaRecorder produced, returns a WAV Blob
 * the Dictation API accepts.
 *
 * Note: decodeAudioData DETACHES the ArrayBuffer it is given, so this must be
 * handed a fresh one per attempt — keep the source Blob if you want to retry.
 * It also needs a COMPLETE container, so only ever call it on the Blob assembled
 * in MediaRecorder's onstop, never on a single ondataavailable slice.
 */
export async function blobToWav16k(recorded: Blob): Promise<Blob> {
  const arrayBuf = await recorded.arrayBuffer();
  const decodeCtx = new (OfflineCtor())(1, 1, TARGET_SAMPLE_RATE);
  const decoded: AudioBuffer = await decodeCtx.decodeAudioData(arrayBuf);

  let mono = downmix(decoded);
  if (decoded.sampleRate !== TARGET_SAMPLE_RATE) {
    mono = await resample(mono, decoded.sampleRate, TARGET_SAMPLE_RATE);
  }
  return encodeWav(floatTo16BitPCM(mono), TARGET_SAMPLE_RATE, 1);
}

export const wavDurationMs = (bytes: number) =>
  Math.max(0, Math.round(((bytes - WAV_HEADER_BYTES) / (TARGET_SAMPLE_RATE * 2)) * 1000));
