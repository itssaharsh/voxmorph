"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, Pencil, RotateCw } from "lucide-react";
import type { Card } from "@/state/types";
import type { Tint } from "@/config/audiences";
import { Lamp, lampColor } from "./Lamp";

type Props = {
  card: Card;
  channel: number;
  tint: Tint | string;
  index: number;
  onCopy: (text: string) => void;
  onRetry: (id: string) => void;
  onEdit: (id: string, text: string) => void;
};

/**
 * One channel on the rack. A row, not a card: the message is prose and wants a
 * real measure, and a grid of equally sized tinted boxes is the arrangement this
 * console exists to refuse. Identity is the channel number plus a 6px lamp.
 */
export function ChannelStrip({ card, channel, tint, index, onCopy, onRetry, onEdit }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(card.text ?? "");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (!editing) setDraft(card.text ?? ""); }, [card.text, editing]);
  useEffect(() => { if (editing) { ref.current?.focus(); ref.current?.select(); } }, [editing]);

  const commit = () => {
    setEditing(false);
    const next = draft.trim();
    if (next && next !== card.text) onEdit(card.id, next);
  };

  const relayed = card.status === "degraded";
  const dead = card.status === "failed";

  return (
    <article
      className="animate-patch grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-2 px-4 py-5 sm:grid-cols-[7.5rem_1fr] sm:gap-x-6 sm:px-6"
      style={{ animationDelay: `${Math.min(index, 6) * 65}ms` }}
    >
      {/* Channel selector: number, lamp, engraved name */}
      <div className="flex items-center gap-2.5 pt-0.5 sm:flex-col sm:items-start sm:gap-1.5">
        <div className="flex items-center gap-2">
          <Lamp tint={tint} lit={!dead} />
          <span className="font-mono text-[13px] tabular-nums text-[var(--color-engrave)]">
            {String(channel).padStart(2, "0")}
          </span>
        </div>
        <span className="vx-legend text-[10px] leading-tight">{card.label}</span>
        <span
          aria-hidden
          className="hidden h-px w-8 sm:block"
          style={{ background: dead ? "var(--color-bevel)" : lampColor(tint), opacity: 0.55 }}
        />
      </div>

      {/* The message */}
      <div className="min-w-0">
        {editing ? (
          <textarea
            ref={ref}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Escape") { setDraft(card.text ?? ""); setEditing(false); }
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commit();
            }}
            rows={4}
            aria-label={`Edit the ${card.label} message`}
            className="w-full resize-y border border-[var(--color-bevel-lit)] bg-[var(--color-hall-deep)] p-2.5 text-[15px] leading-relaxed text-[var(--color-engrave)] outline-none"
          />
        ) : (
          <p className="max-w-[28rem] text-[15px] leading-[1.65] whitespace-pre-wrap text-[var(--color-engrave)]">
            {card.text ?? (
              <span className="text-[var(--color-engrave-faint)]">
                {card.error?.message ?? "No signal on this channel."}
              </span>
            )}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {/* "Relay" is the interpreter's term for routing through another
                language when no direct channel exists. That is exactly what a
                failed rewrite does when it falls back to the baseline cleanup. */}
            {relayed && (
              <span
                className="text-[12px] text-[var(--color-lamp-clean)]"
                title={`The rewrite did not complete (llm_error: ${card.llmError}). Showing the API's cleaned floor text.`}
              >
                {card.retrying ? "relaying, retrying" : <>relayed from floor · <span className="font-mono">{card.llmError}</span></>}
              </span>
            )}
            {dead && (
              <span className="text-[12px] text-[var(--color-live-text)]">
                channel down · <span className="font-mono">{card.error?.code}</span>
              </span>
            )}
            {card.edited && (
              <span className="text-[12px] text-[var(--color-engrave-faint)]">edited</span>
            )}
            <span className="font-mono text-[11px] tabular-nums text-[var(--color-engrave-faint)]">
              {card.text ? `${card.text.length} ch` : "no text"}
              {card.requestTimeMs ? ` · ${card.requestTimeMs}ms` : ""}
              {card.attempts > 1 ? ` · ${card.attempts} tries` : ""}
            </span>
          </div>

          <div className="flex items-center gap-0.5">
            {dead && card.error?.retryable && (
              <Key label={`Retry ${card.label}`} onClick={() => onRetry(card.id)}>
                <RotateCw className="size-3.5" aria-hidden />
              </Key>
            )}
            {card.text && (
              <>
                <Key label={`Edit the ${card.label} message`} onClick={() => setEditing(true)}>
                  <Pencil className="size-3.5" aria-hidden />
                </Key>
                <CopyKey text={card.text} label={card.label} onCopy={onCopy} />
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/** Console keys answer to handling: they seat 1px on press. */
function Key({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="border border-transparent p-1.5 text-[var(--color-engrave-faint)] transition-[color,background-color,transform] hover:border-[var(--color-bevel)] hover:bg-[var(--color-panel-raised)] hover:text-[var(--color-engrave)] active:translate-y-px"
    >
      {children}
    </button>
  );
}

function CopyKey({ text, label, onCopy }: { text: string; label: string; onCopy: (t: string) => void }) {
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
      title="Copy"
      className={`vx-legend flex items-center gap-1.5 border px-2.5 py-1.5 text-[10px] transition-[color,background-color,border-color,transform] active:translate-y-px ${
        done
          ? "border-[var(--color-lamp-team)] text-[var(--color-lamp-team)]"
          : "border-[var(--color-bevel)] bg-[var(--color-panel-raised)] text-[var(--color-engrave-dim)] hover:border-[var(--color-bevel-lit)] hover:text-[var(--color-engrave)]"
      }`}
    >
      {done ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}

export function ChannelSkeleton({ label, channel, tint }: { label: string; channel: number; tint: Tint | string }) {
  return (
    <article
      className="grid grid-cols-[auto_1fr] items-start gap-x-4 px-4 py-5 sm:grid-cols-[7.5rem_1fr] sm:gap-x-6 sm:px-6"
      aria-hidden
    >
      <div className="flex items-center gap-2.5 pt-0.5 sm:flex-col sm:items-start sm:gap-1.5">
        <div className="flex items-center gap-2">
          <Lamp tint={tint} lit={false} />
          <span className="font-mono text-[13px] tabular-nums text-[var(--color-engrave-faint)]">
            {String(channel).padStart(2, "0")}
          </span>
        </div>
        <span className="vx-legend text-[10px] text-[var(--color-engrave-faint)]">{label}</span>
      </div>
      <div className="space-y-2 py-0.5">
        <div className="h-3 w-full animate-pulse bg-[var(--color-panel-raised)]" />
        <div className="h-3 w-9/12 animate-pulse bg-[var(--color-panel-raised)]" />
      </div>
    </article>
  );
}
