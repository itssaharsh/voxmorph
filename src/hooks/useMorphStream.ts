"use client";
import { useCallback, useRef } from "react";
import { parseSseStream } from "@/lib/sse";
import type { Action } from "@/state/reducer";
import type { MorphEvent, MorphJson } from "@/state/types";

/** No `transcript` event by then means something is buffering us — fall back. */
const WATCHDOG_MS = 12_000;

/** Replays a JSON response as the exact same event sequence, so the SSE path and
 *  the JSON path share ONE state-transition code path. */
function* replayAsEvents(json: MorphJson): Generator<MorphEvent> {
  yield { type: "meta", utteranceId: json.utteranceId, audiences: json.meta.audiences,
          audioBytes: json.meta.audioBytes, language: json.meta.language };
  if (json.transcript) yield { type: "transcript", utteranceId: json.utteranceId, transcript: json.transcript };
  for (const card of json.cards) yield { type: "card", utteranceId: json.utteranceId, card };
  yield { type: "done", utteranceId: json.utteranceId, ...json.summary };
}

export function useMorphStream(dispatch: (a: Action) => void) {
  const abortRef = useRef<AbortController | null>(null);

  const post = useCallback(
    async (wav: Blob, opts: { lang: string; audiences?: string[]; stream: boolean; demoFail?: boolean; custom?: string }) => {
      const params = new URLSearchParams({ lang: opts.lang });
      if (opts.audiences?.length) params.set("audiences", opts.audiences.join(","));
      if (!opts.stream) params.set("stream", "0");
      if (opts.demoFail) params.set("demo", "fail");
      if (opts.custom) params.set("custom", opts.custom);
      return fetch(`/api/morph?${params}`, {
        method: "POST",
        headers: { "Content-Type": "audio/wav" },
        body: wav,
        signal: abortRef.current!.signal,
      });
    },
    []
  );

  const morph = useCallback(
    async (wav: Blob, opts: { lang: string; audiences?: string[]; forceJson?: boolean; demoFail?: boolean; custom?: string }) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const runJson = async () => {
        const res = await post(wav, { ...opts, stream: false });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          dispatch({ type: "fail", code: body.code ?? String(res.status), message: body.message ?? "Morph failed." });
          return;
        }
        for (const e of replayAsEvents((await res.json()) as MorphJson)) dispatch(e as Action);
      };

      if (opts.forceJson) return runJson();

      let res: Response;
      try {
        res = await post(wav, { ...opts, stream: true });
      } catch (e) {
        if ((e as Error)?.name === "AbortError") return;
        dispatch({ type: "fail", code: "network", message: "Couldn't reach the server." });
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        dispatch({ type: "fail", code: body.code ?? String(res.status), message: body.message ?? "Morph failed." });
        return;
      }

      // Wrong content type means a proxy rewrote us — retry as plain JSON.
      if (!res.headers.get("content-type")?.includes("text/event-stream") || !res.body) {
        return runJson();
      }

      let sawTranscript = false;
      const watchdog = setTimeout(() => {
        if (!sawTranscript) abortRef.current?.abort();
      }, WATCHDOG_MS);

      try {
        for await (const event of parseSseStream(res.body)) {
          if (event.type === "transcript") sawTranscript = true;
          dispatch(event as Action);
        }
      } catch (e) {
        clearTimeout(watchdog);
        // Aborted before any data arrived: assume buffering and take the JSON path.
        if (!sawTranscript) return runJson();
        if ((e as Error)?.name !== "AbortError") {
          dispatch({ type: "fail", code: "stream", message: "The stream dropped." });
        }
        return;
      }
      clearTimeout(watchdog);
    },
    [dispatch, post]
  );

  const abort = useCallback(() => abortRef.current?.abort(), []);

  /** Transcribe a short clip without touching app state. Used to hear a spoken
   *  audience description; returns the API's cleaned text, falling back to
   *  verbatim. Runs the baseline channel only, so it is one upstream call. */
  const transcribeOnly = useCallback(async (wav: Blob, lang: string): Promise<string | null> => {
    try {
      const res = await fetch(`/api/morph?lang=${encodeURIComponent(lang)}&audiences=baseline&stream=0`, {
        method: "POST", headers: { "Content-Type": "audio/wav" }, body: wav,
      });
      if (!res.ok) return null;
      const json = (await res.json()) as MorphJson;
      return json.transcript?.clean ?? json.transcript?.verbatim ?? null;
    } catch {
      return null;
    }
  }, []);

  return { morph, abort, transcribeOnly };
}
