"use client";
import { useEffect, useRef, useState } from "react";
import {
  Briefcase, Check, Code, Copy, Globe, Heart, Pencil, RefreshCw,
  Sparkles, TriangleAlert, Users, type LucideIcon,
} from "lucide-react";
import type { Card } from "@/state/types";
import type { Tint } from "@/config/audiences";

const ICONS: Record<string, LucideIcon> = {
  Sparkles, Briefcase, Users, Globe, Code, Heart,
};

/** Literal class strings — Tailwind only sees classes it can find in the source. */
const TINT: Record<Tint, { border: string; text: string; glow: string }> = {
  amber:  { border: "border-l-amber-500",  text: "text-amber-300",  glow: "bg-amber-500/5" },
  blue:   { border: "border-l-blue-500",   text: "text-blue-300",   glow: "bg-blue-500/5" },
  green:  { border: "border-l-green-500",  text: "text-green-300",  glow: "bg-green-500/5" },
  purple: { border: "border-l-purple-500", text: "text-purple-300", glow: "bg-purple-500/5" },
  cyan:   { border: "border-l-cyan-500",   text: "text-cyan-300",   glow: "bg-cyan-500/5" },
  rose:   { border: "border-l-rose-500",   text: "text-rose-300",   glow: "bg-rose-500/5" },
};

type Props = {
  card: Card;
  icon: string;
  tint: Tint;
  index: number;
  onCopy: (text: string) => void;
  onRetry: (id: string) => void;
  onEdit: (id: string, text: string) => void;
};

export function AudienceCard({ card, icon, tint, index, onCopy, onRetry, onEdit }: Props) {
  const t = TINT[tint] ?? TINT.amber;
  const Icon = ICONS[icon] ?? Sparkles;
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

  return (
    <article
      className={`animate-cascade flex flex-col rounded-xl border border-slate-800 ${t.border} border-l-4 bg-slate-900/50 p-4`}
      style={{ animationDelay: `${Math.min(index, 6) * 70}ms` }}
    >
      <header className="flex items-center justify-between gap-2">
        <h3 className={`flex items-center gap-2 font-mono text-xs tracking-wider uppercase ${t.text}`}>
          <Icon className="size-3.5" aria-hidden />
          {card.label}
        </h3>
        <div className="flex items-center gap-1.5">
          {card.edited && (
            <span className="rounded border border-slate-700 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
              edited
            </span>
          )}
          {card.status === "degraded" && (
            <span
              className="flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] text-amber-300"
              title={`The rewrite did not complete (llm_error: ${card.llmError}). Showing the API's cleaned transcript instead.`}
            >
              <TriangleAlert className="size-2.5" aria-hidden />
              {card.retrying ? "retrying…" : card.llmError}
            </span>
          )}
          {card.status === "failed" && (
            <span className="rounded border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 font-mono text-[10px] text-rose-300">
              failed
            </span>
          )}
        </div>
      </header>

      <div className="mt-3 grow">
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
            rows={5}
            className="w-full resize-y rounded-lg border border-amber-500/40 bg-slate-950/60 p-2 text-sm leading-relaxed text-slate-100 outline-none"
            aria-label={`Edit the ${card.label} message`}
          />
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-200">
            {card.text ?? (
              <span className="text-slate-500 italic">
                {card.error?.message ?? "No text returned."}
              </span>
            )}
          </p>
        )}
      </div>

      <footer className="mt-4 flex items-center justify-between gap-2 border-t border-slate-800/80 pt-2.5">
        <span className="font-mono text-[10px] tabular-nums text-slate-600">
          {card.text ? `${card.text.length} chars` : "—"}
          {card.requestTimeMs ? ` · ${card.requestTimeMs}ms` : ""}
          {card.attempts > 1 ? ` · ${card.attempts} attempts` : ""}
        </span>
        <div className="flex items-center gap-1">
          {card.status === "failed" && card.error?.retryable && (
            <IconBtn label={`Retry ${card.label}`} onClick={() => onRetry(card.id)}>
              <RefreshCw className="size-3.5" aria-hidden />
            </IconBtn>
          )}
          {card.text && (
            <>
              <IconBtn label={`Edit the ${card.label} message`} onClick={() => setEditing(true)}>
                <Pencil className="size-3.5" aria-hidden />
              </IconBtn>
              <CopyBtn text={card.text} label={card.label} onCopy={onCopy} />
            </>
          )}
        </div>
      </footer>
    </article>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
    >
      {children}
    </button>
  );
}

function CopyBtn({ text, label, onCopy }: { text: string; label: string; onCopy: (t: string) => void }) {
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
      className={`rounded-md p-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
        done ? "text-amber-400" : "text-slate-500 hover:bg-slate-800 hover:text-slate-200"
      }`}
    >
      {done ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
    </button>
  );
}

export function CardSkeleton({ label, tint }: { label: string; tint: Tint }) {
  const t = TINT[tint] ?? TINT.amber;
  return (
    <article className={`rounded-xl border border-slate-800 ${t.border} border-l-4 bg-slate-900/30 p-4`} aria-hidden>
      <div className="flex items-center gap-2">
        <div className="size-3.5 animate-pulse rounded bg-slate-800" />
        <span className="font-mono text-xs tracking-wider text-slate-700 uppercase">{label}</span>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-slate-800" />
        <div className="h-3 w-10/12 animate-pulse rounded bg-slate-800" />
        <div className="h-3 w-7/12 animate-pulse rounded bg-slate-800" />
      </div>
    </article>
  );
}
