"use client";
import { useMemo, useState } from "react";
import { diffVerbatim, removedCount } from "@/lib/diff";
import { LOW_CONFIDENCE } from "@/config/constants";
import type { Transcript } from "@/state/types";
import { useStrikeDraw } from "@/hooks/useMotion";
import { Dot } from "./Dot";

/**
 * Channel 00, the floor: the words as spoken.
 *
 * `text` from the Dictation API is verbatim and never altered. `llm_response`
 * from a call carrying no instruction is AssemblyAI's own default cleanup. The
 * struck words below are the difference between them, so the strike is their
 * model's work, not a filler list of ours.
 */
export function FloorFeed({ transcript, loading }: { transcript: Transcript | null; loading: boolean }) {
  const [cleaned, setCleaned] = useState(false);

  const tokens = useMemo(
    () => (transcript ? diffVerbatim(transcript.verbatim, transcript.clean) : []),
    [transcript]
  );
  const removed = removedCount(tokens);
  const bodyRef = useStrikeDraw(transcript?.verbatim);

  const uncertain = useMemo(() => {
    const s = new Set<number>();
    transcript?.words.forEach((w, i) => { if (w.confidence < LOW_CONFIDENCE) s.add(i); });
    return s;
  }, [transcript]);

  if (loading && !transcript) {
    return (
      <section className="glass p-6 sm:p-10">
        <div className="space-y-3" aria-hidden>
          <div className="h-6 w-11/12 animate-pulse rounded bg-white/10" />
          <div className="h-6 w-7/12 animate-pulse rounded bg-white/10" />
        </div>
      </section>
    );
  }

  if (!transcript) {
    return (
      <section className="glass px-6 py-20 text-center sm:px-8">
        <p className="bg-gradient-to-br from-white via-[#D8CCFF] to-[#8AD8F0] bg-clip-text text-[30px] font-semibold tracking-tight text-transparent sm:text-[38px]">Hold the button. Say anything.</p>
        <p className="mx-auto mt-3 max-w-md text-[16px] text-[var(--color-text-dim)]">
          One sentence becomes six, each written for someone different.
        </p>
      </section>
    );
  }

  return (
    <section className="glass p-6 sm:p-10">
      <div className="mb-4 flex sm:mb-5 flex-wrap items-center justify-between gap-x-5 gap-y-2">
        <span className="flex items-center gap-2.5">
          <Dot tint="floor" />
          <span className="legend text-[11px]">What you said</span>
        </span>

        {transcript.clean && (
          <div className="flex items-center gap-4">
            {removed > 0 && (
              <span className="text-[13px] text-[var(--color-ember)]">
                {removed} removed by the API
              </span>
            )}
            <div className="flex rounded-full border border-[var(--color-edge)] bg-white/5 p-0.5" role="group" aria-label="Transcript view">
              <Toggle active={!cleaned} onClick={() => setCleaned(false)}>Verbatim</Toggle>
              <Toggle active={cleaned} onClick={() => setCleaned(true)}>Cleaned</Toggle>
            </div>
          </div>
        )}
      </div>

      <p
        ref={bodyRef}
        className="max-w-[24ch] text-[26px] leading-[1.25] font-semibold tracking-[-0.03em] text-[var(--color-text)] sm:max-w-[20ch] sm:text-[46px] sm:leading-[1.15]"
        aria-live="polite"
      >
        {cleaned
          ? transcript.clean
          : tokens.map((t, i) => (
              <span
                key={i}
                className={`word ${t.removed ? "struck" : uncertain.has(i) ? "uncertain" : ""}`}
                style={{ animationDelay: `${Math.min(i, 40) * 34}ms` }}
                title={t.removed ? "Removed by the Dictation API's own cleanup" : undefined}
              >
                {t.text}
              </span>
            )).flatMap((el, i) => (i === 0 ? [el] : [" ", el]))}
      </p>

      <p className="mt-7 border-t border-[var(--color-edge)] pt-4 font-mono text-[12px] text-[var(--color-text-faint)]">
        {(transcript.audioDurationMs / 1000).toFixed(1)}s of audio
        {" · "}{transcript.words.length} words
        {" · "}{(transcript.confidence * 100).toFixed(0)}% confidence
        {uncertain.size > 0 && <> · <span className="uncertain">{uncertain.size} uncertain</span></>}
      </p>
    </section>
  );
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3 py-1 text-[12px] transition-colors ${
        active
          ? "bg-white/90 text-[#0B0B12]"
          : "text-[var(--color-text-faint)] hover:text-[var(--color-text-dim)]"
      }`}
    >
      {children}
    </button>
  );
}
