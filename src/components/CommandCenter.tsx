"use client";
import { useCallback, useReducer, useRef, useState } from "react";
import { Aurora } from "./Aurora";
import { ChannelSkeleton, ChannelStrip } from "./ChannelStrip";
import { CustomChannel } from "./CustomChannel";
import { FloorFeed } from "./FloorFeed";
import { TalkKey } from "./TalkKey";
import { Toast, type ToastState } from "./Toast";
import { useRecorder } from "@/hooks/useRecorder";
import { useMorphStream } from "@/hooks/useMorphStream";
import { initialState, reducer, type State } from "@/state/reducer";
import { AUDIENCES, WILDCARDS, getAudience, CUSTOM_ID } from "@/config/audiences";
import { SUPPORTED_LANGUAGES } from "@/config/constants";
import { TriangleAlert } from "lucide-react";

const channelOf = (id: string) => {
  const i = AUDIENCES.findIndex((a) => a.id === id);
  if (i >= 0) return i + 1;
  if (id === CUSTOM_ID) return 7;
  const w = WILDCARDS.findIndex((x) => x.id === id);
  return w >= 0 ? 8 + w : 99;
};
const tintOf = (id: string) =>
  getAudience(id)?.tint ?? (id === CUSTOM_ID ? "custom" : "amber");
const labelOf = (id: string) =>
  getAudience(id)?.label ?? WILDCARDS.find((w) => w.id === id)?.label ?? id;

export function CommandCenter({ seed, forceJson, demoFail }: {
  seed?: Partial<State>; forceJson?: boolean; demoFail?: boolean;
}) {
  const [state, dispatch] = useReducer(
    reducer,
    seed ? { ...initialState, ...seed, isExample: true, status: "ready" as const } : initialState
  );
  const [toast, setToast] = useState<ToastState>(null);
  const { morph, transcribeOnly } = useMorphStream(dispatch);

  // The last recording stays in memory so a new channel never needs the user to
  // speak the whole update again.
  const lastWav = useRef<Blob | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const say = useCallback((message: string, kind: "ok" | "warn" = "ok") => {
    setToast({ id: Date.now(), kind, message });
  }, []);

  const recorder = useRecorder(useCallback((m: string) => say(m, "warn"), [say]));

  const onStart = useCallback(() => {
    void fetch("/api/morph", { method: "GET", cache: "no-store" }).catch(() => {});
    void recorder.start().then((began) => {
      if (!began) return;
      dispatch({ type: "recording:start" });
      const t0 = performance.now();
      tick.current = setInterval(
        () => dispatch({ type: "recording:tick", ms: performance.now() - t0 }), 100);
    });
  }, [recorder]);

  const onStop = useCallback(() => {
    if (tick.current) { clearInterval(tick.current); tick.current = null; }
    void (async () => {
      const result = await recorder.stop();
      if (!result) { dispatch({ type: "reset" }); return; }
      lastWav.current = result.wav;
      dispatch({ type: "recording:stop" });
      await morph(result.wav, { lang: state.language, forceJson, demoFail });
    })();
  }, [recorder, morph, state.language, forceJson, demoFail]);

  const copy = useCallback(async (text: string) => {
    try { await navigator.clipboard.writeText(text); say("Copied."); }
    catch { say("Could not reach the clipboard.", "warn"); }
  }, [say]);

  const runChannel = useCallback((id: string, custom?: string) => {
    if (!lastWav.current) { say("Hold the mic and say something first.", "warn"); return; }
    void morph(lastWav.current, { lang: state.language, audiences: [id], forceJson, demoFail, custom });
  }, [morph, state.language, forceJson, demoFail, say]);

  /** Record a short clip and hand back what the API heard, for the custom channel. */
  const dictateAudience = useCallback(async (): Promise<string | null> => {
    const began = await recorder.start();
    if (!began) return null;
    await new Promise((r) => setTimeout(r, 2600));   // a short, fixed listening window
    const result = await recorder.stop();
    if (!result) return null;
    return transcribeOnly(result.wav, state.language);
  }, [recorder, transcribeOnly, state.language]);

  const busy = state.status === "processing";
  const cards = state.order.map((id) => state.cards[id]).filter(Boolean);

  return (
    <>
    <Aurora level={recorder.level} active={recorder.status === "recording" || busy} />
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pb-44 sm:px-6">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 py-7">
        <h1 className="bg-gradient-to-r from-white via-[#D9CCFF] to-[#7FE3F5] bg-clip-text text-[22px] font-semibold tracking-[-0.03em] text-transparent">
          Voxmorph
        </h1>
        <div className="flex items-baseline gap-5">
          <p className="hidden text-[14px] text-[var(--color-text-faint)] sm:block">
            Say it once. Send it six ways.
          </p>
          <label className="sr-only" htmlFor="lang">Language</label>
          <select
            id="lang"
            value={state.language}
            onChange={(e) => dispatch({ type: "language", code: e.target.value })}
            className="rounded-full border border-[var(--color-edge)] bg-white/5 px-3 py-1 text-[13px] text-[var(--color-text-dim)] outline-none [&>option]:bg-[#12121A]"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
      </header>

      {state.error && (
        <div role="alert" className="glass mb-5 flex items-start gap-3 p-4 text-[15px]"
             style={{ borderColor: "var(--color-ember)", background: "rgba(255,106,61,0.12)" }}>
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[var(--color-ember)]" aria-hidden />
          <div>
            <p className="text-[var(--color-text)]">{state.error.message}</p>
            <p className="mt-0.5 font-mono text-[12px] text-[var(--color-text-faint)]">{state.error.code}</p>
          </div>
        </div>
      )}

      <FloorFeed transcript={state.transcript} loading={busy} />

      {state.isExample && (
        <p className="mt-2.5 text-[13px] text-[var(--color-text-faint)]">
          A saved example from a real API response. Hold the button to run your own.
        </p>
      )}

      {(cards.length > 0 || state.pending.length > 0) && (
        <div className="glass mt-8 divide-y divide-[var(--color-edge)] overflow-hidden">
          {cards.map((card, i) => (
            <ChannelStrip
              key={card.id}
              card={card}
              channel={channelOf(card.id)}
              tint={tintOf(card.id)}
              index={i}
              onCopy={copy}
              onRetry={(id) => runChannel(id)}
              onEdit={(id, text) => dispatch({ type: "card:edit", id, text })}
            />
          ))}
          {state.pending.map((id) => (
            <ChannelSkeleton key={id} label={labelOf(id)} channel={channelOf(id)} tint={tintOf(id)} />
          ))}
          <CustomChannel
            ready
            busy={busy}
            onDictate={dictateAudience}
            onSubmit={(audience) => runChannel(CUSTOM_ID, audience)}
          />
        </div>
      )}

      {lastWav.current && !busy && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-[var(--color-text-faint)]">Or try:</span>
          {WILDCARDS.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => runChannel(w.id)}
              className="rounded-full border border-[var(--color-edge)] bg-white/5 px-3.5 py-1.5 text-[13px] text-[var(--color-text-dim)] transition-all hover:border-[var(--color-edge-lit)] hover:bg-white/10 hover:text-white active:translate-y-px"
            >
              {w.label}
            </button>
          ))}
        </div>
      )}

      <footer className="mt-auto pt-12 pb-2 text-[13px] leading-relaxed text-[var(--color-text-faint)]">
        <p>
          Every channel is one{" "}
          <code className="font-mono text-[var(--color-text-dim)]">llm_instruction</code> on the{" "}
          <a href="https://www.assemblyai.com/docs/dictation" target="_blank" rel="noreferrer noopener"
             className="text-[var(--color-text-dim)] underline decoration-[var(--color-edge-lit)] underline-offset-2 hover:text-[var(--color-text)]">
            AssemblyAI Dictation API
          </a>. No other model is involved.
        </p>
        <p className="mt-1">
          Channel 00 is <code className="font-mono">text</code>, verbatim. Channel 01 is{" "}
          <code className="font-mono">llm_response</code> with no instruction, the API&apos;s own
          cleanup. The struck words are the difference.
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
    </>
  );
}
