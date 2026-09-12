"use client";
import { useCallback, useReducer, useRef, useState } from "react";
import { AudienceCard, CardSkeleton } from "./AudienceCard";
import { MicButton } from "./MicButton";
import { TranscriptPanel } from "./TranscriptPanel";
import { Toast, type ToastState } from "./Toast";
import { useRecorder } from "@/hooks/useRecorder";
import { useMorphStream } from "@/hooks/useMorphStream";
import { initialState, reducer, type State } from "@/state/reducer";
import { AUDIENCES, WILDCARDS, getAudience, type Tint } from "@/config/audiences";
import { SUPPORTED_LANGUAGES } from "@/config/constants";
import { TriangleAlert, Wand2 } from "lucide-react";

export function CommandCenter({ seed, forceJson }: { seed?: Partial<State>; forceJson?: boolean }) {
  const [state, dispatch] = useReducer(reducer, seed ? { ...initialState, ...seed, isExample: true, status: "ready" as const } : initialState);
  const [toast, setToast] = useState<ToastState>(null);
  const { morph } = useMorphStream(dispatch);

  // The last WAV stays in memory so wildcards and per-card retries never need the
  // user to speak again — which is what makes a retake safe mid-demo.
  const lastWav = useRef<Blob | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const say = useCallback((message: string, kind: "ok" | "warn" = "ok") => {
    setToast({ id: Date.now(), kind, message });
  }, []);

  const recorder = useRecorder(useCallback((m: string) => say(m, "warn"), [say]));

  const onStart = useCallback(() => {
    // Pre-warm the exact lambda that is about to receive the audio, and the
    // upstream TLS session with it.
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
      say("Copied — ready to paste.");
    } catch {
      say("Couldn't reach the clipboard.", "warn");
    }
  }, [say]);

  const retry = useCallback((id: string) => {
    if (!lastWav.current) { say("Speak once first.", "warn"); return; }
    void morph(lastWav.current, { lang: state.language, audiences: [id], forceJson });
  }, [morph, state.language, forceJson, say]);

  const wildcard = useCallback((id: string) => {
    if (!lastWav.current) { say("Speak once first, then add an audience.", "warn"); return; }
    void morph(lastWav.current, { lang: state.language, audiences: [id], forceJson });
  }, [morph, state.language, forceJson, say]);

  const busy = state.status === "processing";
  const cards = state.order.map((id) => state.cards[id]).filter(Boolean);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pb-40 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3 py-5">
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-lg font-semibold tracking-tight text-slate-100">voxmorph</span>
          <span className="hidden font-mono text-[11px] text-slate-600 sm:inline">speak once, send everywhere</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="lang">Input language</label>
          <select
            id="lang"
            value={state.language}
            onChange={(e) => dispatch({ type: "language", code: e.target.value })}
            className="rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 font-mono text-xs text-slate-300 outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
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
          className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-200"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p>{state.error.message}</p>
            <p className="mt-0.5 font-mono text-[11px] text-rose-300/60">{state.error.code}</p>
          </div>
        </div>
      )}

      {state.isExample && (
        <p className="mb-3 font-mono text-[11px] text-slate-500">
          Showing a saved example from a real API response. Hold the mic to run your own.
        </p>
      )}

      <TranscriptPanel transcript={state.transcript} loading={busy} />

      <div className="mt-7 flex items-center justify-between gap-3">
        <h2 className="font-mono text-xs tracking-[0.18em] text-slate-500 uppercase">For everyone</h2>
        {state.summary && (
          <span className="font-mono text-[11px] tabular-nums text-slate-600">
            {state.summary.ok} ok
            {state.summary.degraded ? ` · ${state.summary.degraded} degraded` : ""}
            {state.summary.failed ? ` · ${state.summary.failed} failed` : ""}
            {` · ${state.summary.totalMs}ms`}
          </span>
        )}
      </div>

      {cards.length === 0 && state.pending.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-slate-800 bg-slate-900/20 p-6 text-center text-sm text-slate-600">
          Five audience cards will appear here.
        </p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, i) => {
            const a = getAudience(card.id);
            const w = WILDCARDS.find((x) => x.id === card.id);
            return (
              <AudienceCard
                key={card.id}
                card={card}
                index={i}
                icon={a?.icon ?? "Wand2"}
                tint={(a?.tint ?? "amber") as Tint}
                onCopy={copy}
                onRetry={retry}
                onEdit={(id, text) => { dispatch({ type: "card:edit", id, text }); void w; }}
              />
            );
          })}
          {state.pending.map((id) => {
            const a = getAudience(id);
            return <CardSkeleton key={id} label={a?.label ?? id} tint={(a?.tint ?? "amber") as Tint} />;
          })}
        </div>
      )}

      {(state.status === "ready" || cards.length > 0) && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] text-slate-600">
            <Wand2 className="mr-1 inline size-3" aria-hidden />
            same audio, one more instruction:
          </span>
          {WILDCARDS.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => wildcard(w.id)}
              disabled={busy || !lastWav.current}
              className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 font-mono text-[11px] text-slate-300 transition-colors hover:border-amber-500/40 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {w.label}
            </button>
          ))}
        </div>
      )}

      <footer className="mt-auto pt-10 font-mono text-[11px] leading-relaxed text-slate-600">
        <p>
          Every rewrite above is a separate{" "}
          <code className="text-slate-500">llm_instruction</code> on the{" "}
          <a
            href="https://www.assemblyai.com/docs/dictation"
            target="_blank"
            rel="noreferrer noopener"
            className="text-amber-500/70 underline decoration-dotted underline-offset-2 hover:text-amber-400"
          >
            AssemblyAI Dictation API
          </a>
          . No other model is involved.
        </p>
        <p className="mt-1 text-slate-700">
          The verbatim transcript is <code>text</code>; the cleaned version is{" "}
          <code>llm_response</code>. The strike-throughs are the API&apos;s own cleanup.
        </p>
      </footer>

      <MicButton
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
