"use client";
import { useEffect, useRef, useState } from "react";
import { CornerDownLeft, Loader2, Mic, Plus } from "lucide-react";
import { MAX_CUSTOM_AUDIENCE_CHARS } from "@/config/constants";
import { Dot } from "./Dot";

type Props = {
  /** True once there is audio in memory to run a new channel against. */
  ready: boolean;
  busy: boolean;
  /** Capture a spoken audience description and return its transcript. */
  onDictate: () => Promise<string | null>;
  onSubmit: (audience: string) => void;
};

/**
 * "Write it for ___" — the one channel the listener defines.
 *
 * Accepts typed or dictated input. Note that the description becomes part of an
 * `llm_instruction`, which is the one input the Dictation API does not fence; the
 * text is interpolated into a fixed template and sanitized server-side, and the
 * description is shown as the channel's own label so what produced a card is
 * always visible. See buildCustomInstruction and docs/SECURITY-NOTES.md.
 */
const TONES = [
  "my landlord", "a five-year-old", "furious but professional",
  "my investors", "a group chat", "deadpan and very short",
];

export function CustomChannel({ ready, busy, onDictate, onSubmit }: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [listening, setListening] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) input.current?.focus(); }, [open]);

  const submit = () => {
    const v = value.trim();
    if (!v || busy) return;
    onSubmit(v);
    setValue("");
    setOpen(false);
  };

  const dictate = async () => {
    setListening(true);
    try {
      const heard = await onDictate();
      if (heard) { setValue(heard.replace(/[.!?]+\s*$/, "")); input.current?.focus(); }
    } finally {
      setListening(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full items-center gap-3 px-5 py-6 text-left transition-colors hover:bg-white/[0.05] sm:px-8"
      >
        <span className="grid size-7 place-items-center rounded-full border border-[var(--color-edge-lit)] text-[var(--color-ember)] transition-transform group-hover:rotate-90">
          <Plus className="size-4" aria-hidden />
        </span>
        <span>
          <span className="block text-[16px] text-[var(--color-text)]">Write it for someone else</span>
          <span className="block text-[13px] text-[var(--color-text-faint)]">
            Any reader, any tone. Same recording.
          </span>
        </span>
      </button>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-3 px-5 py-6 sm:grid-cols-[9rem_1fr] sm:px-7">
      <header className="flex items-center gap-2.5 sm:flex-col sm:items-start sm:gap-2">
        <span className="flex items-center gap-2">
          <Dot tint="custom" />
          <span className="font-mono text-[12px] tabular-nums text-[var(--color-ch-custom)]">07</span>
        </span>
        <h3 className="legend text-[11px] text-[var(--color-text-dim)]">Write it for</h3>
      </header>

      <div>
        <div className="flex items-center gap-2 rounded-xl border border-[var(--color-edge-lit)] bg-black/30 px-3 py-2.5 transition-colors focus-within:border-[var(--color-ember)]">
          <input
            ref={input}
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, MAX_CUSTOM_AUDIENCE_CHARS))}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); submit(); }
              if (e.key === "Escape") { setOpen(false); setValue(""); }
            }}
            placeholder={listening ? "Listening…" : "my landlord, a five-year-old, my accountant…"}
            aria-label="Describe who this message is for"
            maxLength={MAX_CUSTOM_AUDIENCE_CHARS}
            className="min-w-0 flex-1 bg-transparent text-[16px] text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-faint)]"
          />
          <button
            type="button"
            onClick={() => void dictate()}
            disabled={listening || busy}
            aria-label="Dictate who this is for"
            title="Say it instead"
            className="rounded-[var(--radius)] p-1.5 text-[var(--color-text-faint)] transition-colors hover:bg-[rgba(255,255,255,0.08)] hover:text-[var(--color-ember)] disabled:opacity-50"
          >
            {listening
              ? <Loader2 className="size-4 animate-spin" aria-hidden />
              : <Mic className="size-4" aria-hidden />}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!value.trim() || busy}
            aria-label="Write this channel"
            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-ember)] px-3 py-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-30"
          >
            <CornerDownLeft className="size-3.5" aria-hidden />
            Write
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {TONES.map((t) => (
            <button key={t} type="button" onClick={() => { setValue(t); }}
              className="rounded-full border border-[var(--color-edge)] bg-white/5 px-3 py-1 text-[12px] text-[var(--color-text-dim)] transition-colors hover:border-[var(--color-edge-lit)] hover:text-white">
              {t}
            </button>
          ))}
        </div>
        <p className="mt-2.5 text-[13px] text-[var(--color-text-faint)]">
          {listening ? "Listening, then transcribing…" : "Type it, press a chip, or use the mic."}
        </p>
      </div>
    </div>
  );
}
