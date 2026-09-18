"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, Pencil, RotateCw } from "lucide-react";
import type { Card } from "@/state/types";
import type { Tint } from "@/config/audiences";
import { useDealIn } from "@/hooks/useMotion";
import { Dot, hueOf } from "./Dot";

type Props = {
  card: Card;
  channel: number;
  tint: Tint | string;
  index: number;
  onCopy: (text: string) => void;
  onRetry: (id: string) => void;
  onEdit: (id: string, text: string) => void;
};

/** One channel: a row on a sheet, divided from its neighbours by a hairline.
 *  Prose wants a measure and a hairline, not a card with a coloured border. */
export function ChannelStrip({ card, channel, tint, index, onCopy, onRetry, onEdit }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(card.text ?? "");
  const ta = useRef<HTMLTextAreaElement>(null);
  const ref = useDealIn(true, index) as React.RefObject<HTMLElement | null>;

  useEffect(() => { if (!editing) setDraft(card.text ?? ""); }, [card.text, editing]);
  useEffect(() => { if (editing) { ta.current?.focus(); ta.current?.select(); } }, [editing]);

  const commit = () => {
    setEditing(false);
    const next = draft.trim();
    if (next && next !== card.text) onEdit(card.id, next);
  };

  const relayed = card.status === "degraded";
  const dead = card.status === "failed";

  return (
    <article
      ref={ref as React.RefObject<HTMLElement>}
      className="grid grid-cols-1 gap-x-8 gap-y-3 px-5 py-6 sm:grid-cols-[9rem_1fr] sm:px-7"
    >
      <header className="flex items-center gap-2.5 sm:flex-col sm:items-start sm:gap-2">
        <span className="flex items-center gap-2">
          <Dot tint={tint} muted={dead} />
          <span
            className="font-mono text-[12px] tabular-nums"
            style={{ color: dead ? "var(--color-ink-faint)" : hueOf(tint) }}
          >
            {String(channel).padStart(2, "0")}
          </span>
        </span>
        <h3 className="legend text-[11px] leading-snug text-[var(--color-ink-muted)]">{card.label}</h3>
      </header>

      <div className="min-w-0">
        {editing ? (
          <textarea
            ref={ta}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Escape") { setDraft(card.text ?? ""); setEditing(false); }
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commit();
            }}
            rows={4}
            aria-label={`Edit the ${card.label} message`}
            className="w-full resize-y rounded-[var(--radius)] border border-[var(--color-hairline-strong)] bg-[var(--color-surface)] p-3 text-[16px] leading-[1.6] text-[var(--color-ink)] outline-none focus-visible:border-[var(--color-accent)]"
          />
        ) : (
          <p className="max-w-[62ch] text-[16px] leading-[1.6] whitespace-pre-wrap text-[var(--color-ink)]">
            {card.text ?? (
              <span className="text-[var(--color-ink-faint)]">
                {card.error?.message ?? "No response on this channel."}
              </span>
            )}
          </p>
        )}

        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* "Relay" is the interpreter's term for routing through another language
              when no direct channel exists, which is what a failed rewrite does. */}
          {relayed && (
            <span
              className="text-[13px] text-[var(--color-accent-text)]"
              title={`The rewrite did not complete (llm_error: ${card.llmError}). Showing the API's cleaned transcript.`}
            >
              {card.retrying ? "relaying, retrying" : <>relayed from floor · <span className="font-mono">{card.llmError}</span></>}
            </span>
          )}
          {dead && (
            <span className="text-[13px] text-[var(--color-accent-text)]">
              channel down · <span className="font-mono">{card.error?.code}</span>
            </span>
          )}
          {card.edited && <span className="text-[13px] text-[var(--color-ink-faint)]">edited</span>}

          <span className="font-mono text-[12px] tabular-nums text-[var(--color-ink-faint)]">
            {card.text ? `${card.text.length}` : "—"}
          </span>

          <span className="ml-auto flex items-center gap-1">
            {dead && card.error?.retryable && (
              <Ghost label={`Retry ${card.label}`} onClick={() => onRetry(card.id)}>
                <RotateCw className="size-3.5" aria-hidden />
              </Ghost>
            )}
            {card.text && (
              <>
                <Ghost label={`Edit the ${card.label} message`} onClick={() => setEditing(true)}>
                  <Pencil className="size-3.5" aria-hidden />
                </Ghost>
                <CopyButton text={card.text} label={card.label} onCopy={onCopy} />
              </>
            )}
          </span>
        </div>
      </div>
    </article>
  );
}

function Ghost({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button" onClick={onClick} aria-label={label} title={label}
      className="rounded-[var(--radius)] p-2 text-[var(--color-ink-faint)] transition-colors hover:bg-[var(--color-sunk)] hover:text-[var(--color-ink)] active:translate-y-px"
    >
      {children}
    </button>
  );
}

function CopyButton({ text, label, onCopy }: { text: string; label: string; onCopy: (t: string) => void }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1600);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <button
      type="button"
      onClick={() => { onCopy(text); setDone(true); }}
      aria-label={`Copy the ${label} message`}
      className={`flex items-center gap-1.5 rounded-[var(--radius)] border px-2.5 py-1.5 text-[12px] transition-colors active:translate-y-px ${
        done
          ? "border-[var(--color-accent)] text-[var(--color-accent-text)]"
          : "border-[var(--color-hairline-strong)] text-[var(--color-ink-muted)] hover:border-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
      }`}
    >
      {done ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}

export function ChannelSkeleton({ label, channel, tint }: { label: string; channel: number; tint: Tint | string }) {
  return (
    <article className="grid grid-cols-1 gap-x-8 gap-y-3 px-5 py-6 sm:grid-cols-[9rem_1fr] sm:px-7" aria-hidden>
      <header className="flex items-center gap-2.5 sm:flex-col sm:items-start sm:gap-2">
        <span className="flex items-center gap-2">
          <Dot tint={tint} muted />
          <span className="font-mono text-[12px] tabular-nums text-[var(--color-ink-faint)]">
            {String(channel).padStart(2, "0")}
          </span>
        </span>
        <span className="legend text-[11px] text-[var(--color-ink-faint)]">{label}</span>
      </header>
      <div className="space-y-2.5 py-1">
        <div className="h-3.5 w-full animate-pulse rounded bg-[var(--color-sunk)]" />
        <div className="h-3.5 w-8/12 animate-pulse rounded bg-[var(--color-sunk)]" />
      </div>
    </article>
  );
}
