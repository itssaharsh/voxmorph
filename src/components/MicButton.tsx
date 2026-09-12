"use client";
import { useCallback, useEffect, useRef } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import type { RecorderStatus } from "@/hooks/useRecorder";

type Props = {
  status: RecorderStatus;
  /** 0..1 RMS from the live mic — drives the ring, so the pulse is real audio. */
  level: number;
  busy: boolean;
  recordingMs: number;
  onStart: () => void;
  onStop: () => void;
};

export function MicButton({ status, level, busy, recordingMs, onStart, onStop }: Props) {
  const activeId = useRef<number | null>(null);
  const spaceDown = useRef(false);
  const recording = status === "recording";
  const encoding = status === "encoding" || busy;

  const down = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (encoding || activeId.current !== null) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      activeId.current = e.pointerId;
      // Keeps delivering events if the finger slides off the button.
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
      onStart();
    },
    [encoding, onStart]
  );

  const up = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (activeId.current !== e.pointerId) return;
      activeId.current = null;
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
      onStop();
    },
    [onStop]
  );

  // Hold Space as a keyboard equivalent. Guarded against auto-repeat.
  useEffect(() => {
    const isTyping = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      return !!el && (el.tagName === "TEXTAREA" || el.tagName === "INPUT" || el.isContentEditable);
    };
    const kd = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || spaceDown.current || isTyping(e.target)) return;
      e.preventDefault();
      spaceDown.current = true;
      onStart();
    };
    const ku = (e: KeyboardEvent) => {
      if (e.code !== "Space" || !spaceDown.current) return;
      e.preventDefault();
      spaceDown.current = false;
      onStop();
    };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, [onStart, onStop]);

  const secs = (recordingMs / 1000).toFixed(1);
  const ring = 1 + Math.min(0.28, level * 0.34);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-3 pb-8">
      <div className="pointer-events-none h-5 font-mono text-xs tabular-nums text-slate-400">
        {recording ? (
          <span className="text-amber-400">● {secs}s — release to send</span>
        ) : encoding ? (
          <span>Transforming…</span>
        ) : (
          <span className="text-slate-500">Hold to talk · or hold Space</span>
        )}
      </div>

      <button
        type="button"
        aria-label={recording ? "Release to transform" : "Hold to record"}
        aria-pressed={recording}
        disabled={encoding}
        onPointerDown={down}
        onPointerUp={up}
        onPointerCancel={up}
        onLostPointerCapture={up}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        className={[
          "pointer-events-auto relative grid size-[72px] place-items-center rounded-full",
          "transition-[transform,box-shadow] duration-150 outline-none",
          "focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
          encoding
            ? "cursor-wait bg-slate-800 text-slate-400"
            : recording
              ? "scale-105 bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30"
              : "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 active:scale-95",
        ].join(" ")}
        style={{
          // Suppress long-press selection/callout via CSS: React registers touch
          // listeners as passive, so preventDefault() there is ignored.
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {recording && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-full border-2 border-amber-400/60"
            style={{ transform: `scale(${ring})`, transition: "transform 80ms linear" }}
          />
        )}
        {encoding ? (
          <Loader2 className="size-7 animate-spin" aria-hidden style={{ pointerEvents: "none" }} />
        ) : recording ? (
          <Square className="size-6 fill-current" aria-hidden style={{ pointerEvents: "none" }} />
        ) : (
          <Mic className="size-7" aria-hidden style={{ pointerEvents: "none" }} />
        )}
      </button>
    </div>
  );
}
