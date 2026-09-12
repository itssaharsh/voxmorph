"use client";
import { useMemo, useState } from "react";
import { Eraser, Quote } from "lucide-react";
import { diffVerbatim, removedCount } from "@/lib/diff";
import { LOW_CONFIDENCE } from "@/config/constants";
import type { Transcript } from "@/state/types";

/**
 * "You said" — and the single most API-specific thing in the product.
 *
 * `text` from the Dictation API is the VERBATIM transcript; `llm_response` from a
 * call with no `llm_instruction` is AssemblyAI's own default cleanup of it. So the
 * struck-through words below are literally what their model removed — not a filler
 * word list of ours.
 */
export function TranscriptPanel({ transcript, loading }: { transcript: Transcript | null; loading: boolean }) {
  const [showVerbatim, setShowVerbatim] = useState(true);

  const tokens = useMemo(
    () => (transcript ? diffVerbatim(transcript.verbatim, transcript.clean) : []),
    [transcript]
  );
  const removed = removedCount(tokens);

  // Per-word confidence, matched positionally against the verbatim tokens.
  const lowConf = useMemo(() => {
    if (!transcript) return new Set<number>();
    const s = new Set<number>();
    transcript.words.forEach((w, i) => { if (w.confidence < LOW_CONFIDENCE) s.add(i); });
    return s;
  }, [transcript]);

  if (loading && !transcript) {
    return (
      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <Header />
        <div className="mt-4 space-y-2" aria-hidden>
          <div className="h-4 w-11/12 animate-pulse rounded bg-slate-800" />
          <div className="h-4 w-9/12 animate-pulse rounded bg-slate-800" />
          <div className="h-4 w-5/12 animate-pulse rounded bg-slate-800" />
        </div>
      </section>
    );
  }

  if (!transcript) {
    return (
      <section className="rounded-xl border border-dashed border-slate-800 bg-slate-900/20 p-8 text-center">
        <Quote className="mx-auto size-5 text-slate-700" aria-hidden />
        <p className="mt-3 font-mono text-sm text-slate-500">Hold the mic. Say anything.</p>
        <p className="mt-1 text-xs text-slate-600">
          One utterance becomes five messages, each written for a different audience.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Header />
        <div className="flex items-center gap-2">
          {removed > 0 && (
            <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] text-amber-300">
              <Eraser className="mr-1 inline size-3" aria-hidden />
              {removed} removed by the API
            </span>
          )}
          {transcript.clean && (
            <div className="flex rounded-lg border border-slate-800 p-0.5" role="group" aria-label="Transcript view">
              <Toggle active={showVerbatim} onClick={() => setShowVerbatim(true)}>Verbatim</Toggle>
              <Toggle active={!showVerbatim} onClick={() => setShowVerbatim(false)}>Cleaned</Toggle>
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 font-mono text-[15px] leading-relaxed text-slate-100" aria-live="polite">
        {showVerbatim
          ? tokens.map((t, i) => (
              <span
                key={i}
                className={[
                  t.removed ? "vx-removed" : "",
                  !t.removed && lowConf.has(i)
                    ? "underline decoration-amber-500/60 decoration-dotted decoration-2 underline-offset-4"
                    : "",
                ].join(" ")}
                title={t.removed ? "Removed by the Dictation API's cleanup" : undefined}
              >
                {t.text}{i < tokens.length - 1 ? " " : ""}
              </span>
            ))
          : transcript.clean}
      </p>

      <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-slate-800/80 pt-3 font-mono text-[11px] text-slate-500">
        <Stat label="confidence" value={`${(transcript.confidence * 100).toFixed(1)}%`} />
        <Stat label="words" value={String(transcript.words.length)} />
        <Stat label="audio" value={`${(transcript.audioDurationMs / 1000).toFixed(1)}s`} />
        {transcript.requestTimeMs ? <Stat label="server" value={`${Math.round(transcript.requestTimeMs)}ms`} /> : null}
        {lowConf.size > 0 && <Stat label="low-confidence" value={String(lowConf.size)} />}
      </dl>
    </section>
  );
}

function Header() {
  return (
    <h2 className="font-mono text-xs tracking-[0.18em] text-slate-500 uppercase">You said</h2>
  );
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors ${
        active ? "bg-slate-800 text-slate-100" : "text-slate-500 hover:text-slate-300"
      }`}
    >
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="text-slate-600">{label}</dt>
      <dd className="tabular-nums text-slate-400">{value}</dd>
    </div>
  );
}
