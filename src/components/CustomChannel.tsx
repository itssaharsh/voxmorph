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

  if (!ready) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2.5 px-5 py-5 text-left text-[15px] text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-sunk)] sm:px-7"
      >
        <Plus className="size-4 text-[var(--color-ink-faint)]" aria-hidden />
        Write it for someone else
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
        <h3 className="legend text-[11px] text-[var(--color-ink-muted)]">Write it for</h3>
      </header>

      <div>
        <div className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--color-hairline-strong)] bg-[var(--color-surface)] px-3 py-2 focus-within:border-[var(--color-accent)]">
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
            className="min-w-0 flex-1 bg-transparent text-[16px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
          />
          <button
            type="button"
            onClick={() => void dictate()}
            disabled={listening || busy}
            aria-label="Dictate who this is for"
            title="Say it instead"
            className="rounded-[var(--radius)] p-1.5 text-[var(--color-ink-faint)] transition-colors hover:bg-[var(--color-sunk)] hover:text-[var(--color-accent-text)] disabled:opacity-50"
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
            className="flex items-center gap-1.5 rounded-[var(--radius)] bg-[var(--color-ink)] px-2.5 py-1.5 text-[12px] text-[var(--color-surface)] transition-opacity hover:opacity-90 disabled:opacity-30"
          >
            <CornerDownLeft className="size-3.5" aria-hidden />
            Write
          </button>
        </div>
        <p className="mt-2 text-[13px] text-[var(--color-ink-faint)]">
          {listening
            ? "Hold on, transcribing what you said."
            : "Type it or press the mic. Same recording, one more instruction."}
        </p>
      </div>
    </div>
  );
}
