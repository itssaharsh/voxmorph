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
      <section className="sheet p-6 sm:p-8">
        <div className="space-y-3" aria-hidden>
          <div className="h-5 w-11/12 animate-pulse rounded bg-[var(--color-sunk)]" />
          <div className="h-5 w-7/12 animate-pulse rounded bg-[var(--color-sunk)]" />
        </div>
      </section>
    );
  }

  if (!transcript) {
    return (
      <section className="sheet px-6 py-14 text-center sm:px-8">
        <p className="text-[19px] text-[var(--color-ink-muted)]">Hold the button. Say anything.</p>
        <p className="mx-auto mt-2 max-w-sm text-[14px] text-[var(--color-ink-faint)]">
          One sentence becomes six, each written for someone different.
        </p>
      </section>
    );
  }

  return (
    <section className="sheet p-5 sm:p-8">
      <div className="mb-4 flex sm:mb-5 flex-wrap items-center justify-between gap-x-5 gap-y-2">
        <span className="flex items-center gap-2.5">
          <Dot tint="floor" />
          <span className="legend text-[11px]">What you said</span>
        </span>

        {transcript.clean && (
          <div className="flex items-center gap-4">
            {removed > 0 && (
              <span className="text-[13px] text-[var(--color-accent-text)]">
                {removed} removed by the API
              </span>
            )}
            <div className="flex rounded-[var(--radius)] bg-[var(--color-sunk)] p-0.5" role="group" aria-label="Transcript view">
              <Toggle active={!cleaned} onClick={() => setCleaned(false)}>Verbatim</Toggle>
              <Toggle active={cleaned} onClick={() => setCleaned(true)}>Cleaned</Toggle>
            </div>
          </div>
        )}
      </div>

      <p
        ref={bodyRef}
        className="max-w-[52ch] font-mono text-[17px] leading-[1.55] tracking-[-0.01em] text-[var(--color-ink)] sm:text-[26px] sm:leading-[1.5]"
        aria-live="polite"
      >
        {cleaned
          ? transcript.clean
          : tokens.map((t, i) => (
              <span
                key={i}
                className={t.removed ? "struck" : uncertain.has(i) ? "uncertain" : undefined}
                title={t.removed ? "Removed by the Dictation API's own cleanup" : undefined}
              >
                {t.text}{i < tokens.length - 1 ? " " : ""}
              </span>
            ))}
      </p>

      <p className="mt-5 border-t border-[var(--color-hairline)] pt-3.5 text-[13px] text-[var(--color-ink-faint)] sm:mt-6 sm:pt-4">
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
      className={`rounded-[4px] px-2.5 py-1 text-[12px] transition-colors ${
        active
          ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[0_1px_2px_rgba(22,23,26,0.08)]"
          : "text-[var(--color-ink-faint)] hover:text-[var(--color-ink-muted)]"
      }`}
    >
      {children}
    </button>
  );
}
