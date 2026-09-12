"use client";
import { useCallback, useReducer, useRef, useState } from "react";
import { ChannelSkeleton, ChannelStrip } from "./ChannelStrip";
import { FloorFeed } from "./FloorFeed";
import { TalkKey } from "./TalkKey";
import { Toast, type ToastState } from "./Toast";
import { Lamp } from "./Lamp";
import { useRecorder } from "@/hooks/useRecorder";
import { useMorphStream } from "@/hooks/useMorphStream";
import { initialState, reducer, type State } from "@/state/reducer";
import { AUDIENCES, WILDCARDS, getAudience } from "@/config/audiences";
import { SUPPORTED_LANGUAGES } from "@/config/constants";
import { TriangleAlert } from "lucide-react";

/** Channel numbers are fixed positions on the rack, like decimal places on an
 *  instrument: floor is 00, the API's own cleanup is 01, audiences follow. */
const channelOf = (id: string) => {
  const i = AUDIENCES.findIndex((a) => a.id === id);
  if (i >= 0) return i + 1;
  const w = WILDCARDS.findIndex((x) => x.id === id);
  return w >= 0 ? 90 + w + 1 : 99;
};
const tintOf = (id: string) => getAudience(id)?.tint ?? "wild";
const labelOf = (id: string) =>
  getAudience(id)?.label ?? WILDCARDS.find((w) => w.id === id)?.label ?? id;

export function CommandCenter({ seed, forceJson }: { seed?: Partial<State>; forceJson?: boolean }) {
  const [state, dispatch] = useReducer(
    reducer,
    seed ? { ...initialState, ...seed, isExample: true, status: "ready" as const } : initialState
  );
  const [toast, setToast] = useState<ToastState>(null);
  const { morph } = useMorphStream(dispatch);

  // The last WAV stays in memory so a wildcard or a retry never needs the user to
  // speak again, which is what makes a second take safe during a demo.
  const lastWav = useRef<Blob | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const say = useCallback((message: string, kind: "ok" | "warn" = "ok") => {
    setToast({ id: Date.now(), kind, message });
  }, []);

  const recorder = useRecorder(useCallback((m: string) => say(m, "warn"), [say]));

  const onStart = useCallback(() => {
    // Warm the exact function that is about to receive the audio.
    void fetch("/api/morph", { method: "GET", cache: "no-store" }).catch(() => {});
    void recorder.start().then((began) => {
      if (!began) return;
      dispatch({ type: "recording:start" });
      const t0 = performance.now();
      tickRef.current = setInterval(
        () => dispatch({ type: "recording:tick", ms: performance.now() - t0 }),
        100
      );
    });
  }, [recorder]);

  const onStop = useCallback(() => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    void (async () => {
      const result = await recorder.stop();
      if (!result) { dispatch({ type: "reset" }); return; }
      lastWav.current = result.wav;
      dispatch({ type: "recording:stop" });
      await morph(result.wav, { lang: state.language, forceJson });
    })();
  }, [recorder, morph, state.language, forceJson]);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      say("Copied. Ready to paste.");
    } catch {
      say("Could not reach the clipboard.", "warn");
    }
  }, [say]);

  const patchOne = useCallback((id: string) => {
    if (!lastWav.current) { say("Speak once first.", "warn"); return; }
    void morph(lastWav.current, { lang: state.language, audiences: [id], forceJson });
  }, [morph, state.language, forceJson, say]);

  const busy = state.status === "processing";
  const cards = state.order.map((id) => state.cards[id]).filter(Boolean);
  const live = recorder.status === "recording";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 pb-44 sm:px-6">
      {/* Console header */}
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-[var(--color-bevel)] py-4">
        <div className="flex items-baseline gap-3">
          <span className="font-[family-name:var(--font-legend)] text-[22px] font-600 tracking-[0.2em] text-[var(--color-engrave)] uppercase">
            Voxmorph
          </span>
          <span className="hidden text-[13px] text-[var(--color-engrave-faint)] sm:inline">
            one voice in, six channels out
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2" aria-live="polite">
            <Lamp tint={live ? "rose" : "floor"} lit={live} size={7} />
            <span className="vx-legend text-[10px]">{live ? "On air" : "Standby"}</span>
          </span>
          <label className="sr-only" htmlFor="lang">Floor language</label>
          <select
            id="lang"
            value={state.language}
            onChange={(e) => dispatch({ type: "language", code: e.target.value })}
            className="vx-panel px-2 py-1 font-mono text-[11px] text-[var(--color-engrave-dim)] outline-none"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
      </header>

      {state.error && (
        <div
          role="alert"
          className="vx-panel mt-4 flex items-start gap-2.5 px-4 py-3 text-[13px]"
          style={{ borderColor: "var(--color-live)" }}
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[var(--color-live)]" aria-hidden />
          <div>
            <p className="text-[var(--color-engrave)]">{state.error.message}</p>
            <p className="mt-0.5 font-mono text-[11px] text-[var(--color-engrave-faint)]">
              {state.error.code}
            </p>
          </div>
        </div>
      )}

      <div className="mt-5">
        <FloorFeed transcript={state.transcript} loading={busy} />
      </div>

      {state.isExample && (
        <p className="mt-2 text-[12px] text-[var(--color-engrave-faint)]">
          A saved example from a real API response. Hold the key to run your own.
        </p>
      )}

      {/* The rack */}
      <div className="mt-8 flex items-baseline justify-between gap-4 border-b border-[var(--color-bevel)] pb-2">
        <span className="vx-legend text-[11px]">Channels</span>
        {state.summary && (
          <span className="font-mono text-[11px] tabular-nums text-[var(--color-engrave-faint)]">
            {state.summary.ok} clear
            {state.summary.degraded ? ` · ${state.summary.degraded} relayed` : ""}
            {state.summary.failed ? ` · ${state.summary.failed} down` : ""}
            {` · ${state.summary.totalMs}ms`}
          </span>
        )}
      </div>

      {cards.length === 0 && state.pending.length === 0 ? (
        <p className="mt-6 text-[15px] text-[var(--color-engrave-faint)]">
          Five audience channels patch in here, plus the API&apos;s own cleanup on channel 01.
        </p>
      ) : (
        <div className="vx-rack mt-3">
          {cards.map((card, i) => (
            <ChannelStrip
              key={card.id}
              card={card}
              channel={channelOf(card.id)}
              tint={tintOf(card.id)}
              index={i}
              onCopy={copy}
              onRetry={patchOne}
              onEdit={(id, text) => dispatch({ type: "card:edit", id, text })}
            />
          ))}
          {state.pending.map((id) => (
            <ChannelSkeleton
              key={id}
              label={labelOf(id)}
              channel={channelOf(id)}
              tint={tintOf(id)}
            />
          ))}
        </div>
      )}

      {lastWav.current && (state.status === "ready" || cards.length > 0) && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="vx-legend text-[10px]">Patch another</span>
          {WILDCARDS.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => patchOne(w.id)}
              disabled={busy}
              className="vx-panel px-3 py-1 text-[12px] text-[var(--color-engrave-dim)] transition-[color,border-color,transform] hover:border-[var(--color-bevel-lit)] hover:text-[var(--color-engrave)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
            >
              {w.label}
            </button>
          ))}
        </div>
      )}

      <footer className="mt-auto border-t border-[var(--color-bevel)] pt-5 pb-2 text-[13px] leading-relaxed text-[var(--color-engrave-faint)]">
        <p>
          Every channel above is a separate{" "}
          <code className="text-[var(--color-engrave-dim)]">llm_instruction</code> on the{" "}
          <a
            href="https://www.assemblyai.com/docs/dictation"
            target="_blank"
            rel="noreferrer noopener"
            className="text-[var(--color-engrave-dim)] underline decoration-dotted underline-offset-2 hover:text-[var(--color-engrave)]"
          >
            AssemblyAI Dictation API
          </a>
          . No other model is involved.
        </p>
        <p className="mt-1">
          Channel 00 is <code>text</code>, the verbatim floor feed. Channel 01 is{" "}
          <code>llm_response</code> with no instruction, which is the API&apos;s own cleanup.
          The struck words are the difference between them.
        </p>
      </footer>

      <TalkKey
        status={recorder.status}
        level={recorder.level}
        busy={busy}
        recordingMs={state.recordingMs}
        onStart={onStart}
        onStop={onStop}
      />
      <Toast toast={toast} onDone={() => setToast(null)} />
    </div>
  );
}
