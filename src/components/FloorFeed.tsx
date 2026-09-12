"use client";
import { useMemo, useState } from "react";
import { diffVerbatim, removedCount } from "@/lib/diff";
import { LOW_CONFIDENCE } from "@/config/constants";
import type { Transcript } from "@/state/types";
import { Lamp } from "./Lamp";

/**
 * Channel 00, the floor.
 *
 * In conference interpretation the floor is the original speaker's audio, passed
 * through untouched. That is exactly what the Dictation API returns as `text`:
 * verbatim, fillers intact, never altered. The struck words below are the
 * difference between it and `llm_response` from a call carrying no instruction,
 * which is the API's own default cleanup. Nothing here is our regex.
 */
export function FloorFeed({ transcript, loading }: { transcript: Transcript | null; loading: boolean }) {
  const [cleaned, setCleaned] = useState(false);

  const tokens = useMemo(
    () => (transcript ? diffVerbatim(transcript.verbatim, transcript.clean) : []),
    [transcript]
  );
  const removed = removedCount(tokens);

  const uncertain = useMemo(() => {
    const s = new Set<number>();
    transcript?.words.forEach((w, i) => { if (w.confidence < LOW_CONFIDENCE) s.add(i); });
    return s;
  }, [transcript]);

  return (
    <section className="vx-panel px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2.5">
          <Lamp tint="floor" lit={!!transcript} />
          <span className="vx-legend text-[11px]">CH 00 · Floor</span>
          <span className="font-mono text-[11px] text-[var(--color-engrave-faint)]">
            as spoken
          </span>
        </div>

        {transcript?.clean && (
          <div className="flex items-center gap-3">
            {removed > 0 && (
              <span className="font-mono text-[11px] tabular-nums text-[var(--color-lamp-clean)]">
                {removed} removed by the API
              </span>
            )}
            <div className="flex border border-[var(--color-bevel)]" role="group" aria-label="Floor feed view">
              <Toggle active={!cleaned} onClick={() => setCleaned(false)}>Verbatim</Toggle>
              <Toggle active={cleaned} onClick={() => setCleaned(true)}>Cleaned</Toggle>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3.5 border-t border-[var(--color-bevel)] pt-3.5">
        {loading && !transcript ? (
          <div className="space-y-2.5" aria-hidden>
            <div className="h-3.5 w-11/12 animate-pulse bg-[var(--color-panel-raised)]" />
            <div className="h-3.5 w-8/12 animate-pulse bg-[var(--color-panel-raised)]" />
          </div>
        ) : !transcript ? (
          <p className="font-mono text-sm text-[var(--color-engrave-faint)]">
            Channel open. Hold the key and speak.
          </p>
        ) : (
          <p
            className="max-w-[72ch] font-mono text-[15px] leading-[1.75] text-[var(--color-engrave)]"
            aria-live="polite"
          >
            {cleaned
              ? transcript.clean
              : tokens.map((t, i) => (
                  <span
                    key={i}
                    className={
                      t.removed ? "vx-struck" : uncertain.has(i) ? "vx-uncertain" : undefined
                    }
                    title={t.removed ? "Removed by the Dictation API's own cleanup" : undefined}
                  >
                    {t.text}
                    {i < tokens.length - 1 ? " " : ""}
                  </span>
                ))}
          </p>
        )}
      </div>

      {transcript && (
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-[var(--color-bevel)] pt-3">
          <Readout label="signal" value={`${(transcript.confidence * 100).toFixed(1)}%`} />
          <Readout label="words" value={String(transcript.words.length)} />
          <Readout label="length" value={`${(transcript.audioDurationMs / 1000).toFixed(1)}s`} />
          {transcript.requestTimeMs ? (
            <Readout label="server" value={`${Math.round(transcript.requestTimeMs)}ms`} />
          ) : null}
          {uncertain.size > 0 && <Readout label="uncertain" value={String(uncertain.size)} />}
        </dl>
      )}
    </section>
  );
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`vx-legend px-2.5 py-1 text-[10px] transition-colors ${
        active
          ? "bg-[var(--color-panel-raised)] text-[var(--color-engrave)]"
          : "text-[var(--color-engrave-faint)] hover:text-[var(--color-engrave-dim)]"
      }`}
    >
      {children}
    </button>
  );
}

/** Numerals are engineered objects: tabular, fixed width, mono. */
function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="vx-legend text-[10px] text-[var(--color-engrave-faint)]">{label}</dt>
      <dd className="font-mono text-[11px] tabular-nums text-[var(--color-engrave-dim)]">{value}</dd>
    </div>
  );
}
