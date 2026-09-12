"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AudioCtxCtor, blobToWav16k, pickMimeType } from "@/lib/audio/wav";
import { MIN_RECORD_MS, MAX_RECORD_MS } from "@/config/constants";

export type RecorderStatus = "idle" | "requesting" | "recording" | "encoding" | "denied" | "unsupported";

export type RecorderResult = { wav: Blob; durationMs: number };

/**
 * Hold-to-talk capture. MediaRecorder gives us a container this browser can
 * definitely decode (it just wrote it), and blobToWav16k turns it into the
 * 16 kHz mono WAV the Dictation API requires.
 *
 * The AudioContext is only for the level meter; capture goes through
 * MediaRecorder, so no cross-sample-rate MediaStreamAudioSourceNode is ever
 * created and the Firefox <148 throw cannot happen.
 */
export function useRecorder(onError?: (msg: string) => void) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [level, setLevel] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const partsRef = useRef<BlobPart[]>([]);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const stoppedRef = useRef<((b: Blob) => void) | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supported = typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia;

  const stopMeter = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setLevel(0);
  }, []);

  const teardown = useCallback(() => {
    stopMeter();
    if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null; }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recRef.current = null;
    void ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    analyserRef.current = null;
  }, [stopMeter]);

  useEffect(() => teardown, [teardown]);

  /** Drives the mic button's pulse from real audio, not a fake animation. */
  const runMeter = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.fftSize);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      setLevel(Math.min(1, Math.sqrt(sum / data.length) * 3.2));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    if (!supported) { setStatus("unsupported"); onError?.("This browser cannot record audio."); return false; }
    if (recRef.current) return false;
    setStatus("requesting");

    // iOS: construct and resume the AudioContext synchronously, before the first
    // await — an `await getUserMedia` breaks the user-gesture chain.
    let ctx: AudioContext | null = null;
    try {
      ctx = new (AudioCtxCtor())();
      void ctx.resume();
    } catch { ctx = null; }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
    } catch (e) {
      void ctx?.close().catch(() => {});
      setStatus("denied");
      const name = (e as Error)?.name;
      onError?.(name === "NotAllowedError"
        ? "Microphone blocked. Allow access and try again."
        : "Couldn't open the microphone.");
      return false;
    }

    streamRef.current = stream;
    if (ctx) {
      try {
        // Level meter only. MediaRecorder consumes the same MediaStream
        // independently, and an AudioNode output can feed any number of inputs.
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.7;
        src.connect(analyser);
        ctxRef.current = ctx;
        analyserRef.current = analyser;
        runMeter();
      } catch {
        void ctx.close().catch(() => {}); // metering is cosmetic; never fail the capture for it
      }
    }

    const mimeType = pickMimeType();
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    partsRef.current = [];
    rec.ondataavailable = (e) => { if (e.data.size > 0) partsRef.current.push(e.data); };
    rec.onstop = () => {
      // Assemble here, never from a single ondataavailable slice: decodeAudioData
      // needs a complete container.
      const blob = new Blob(partsRef.current, { type: rec.mimeType || mimeType || "audio/webm" });
      stoppedRef.current?.(blob);
    };
    recRef.current = rec;
    startedAtRef.current = performance.now();
    rec.start();
    setStatus("recording");

    autoStopRef.current = setTimeout(() => { void stop(); }, MAX_RECORD_MS);
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported, onError, runMeter]);

  const stop = useCallback(async (): Promise<RecorderResult | null> => {
    const rec = recRef.current;
    if (!rec) return null;
    const heldMs = performance.now() - startedAtRef.current;
    if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null; }

    const blob = await new Promise<Blob>((resolve) => {
      stoppedRef.current = resolve;
      if (rec.state !== "inactive") rec.stop(); else resolve(new Blob(partsRef.current));
    });
    stoppedRef.current = null;
    teardown();

    // Filters accidental taps, and Safari returns junk below ~300ms.
    if (heldMs < MIN_RECORD_MS) {
      setStatus("idle");
      onError?.("Hold the button while you speak.");
      return null;
    }

    setStatus("encoding");
    try {
      const wav = await blobToWav16k(blob);
      setStatus("idle");
      return { wav, durationMs: Math.round(heldMs) };
    } catch {
      setStatus("idle");
      onError?.("Could not process that audio. Try again.");
      return null;
    }
  }, [teardown, onError]);

  const cancel = useCallback(() => {
    const rec = recRef.current;
    stoppedRef.current = null;
    if (rec && rec.state !== "inactive") { try { rec.stop(); } catch {} }
    teardown();
    setStatus("idle");
  }, [teardown]);

  return { status, level, supported, start, stop, cancel };
}
