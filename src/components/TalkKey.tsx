"use client";
import { useCallback, useEffect, useRef } from "react";
import { Loader2, Mic } from "lucide-react";
import type { RecorderStatus } from "@/hooks/useRecorder";

type Props = {
  status: RecorderStatus;
  level: number;      // 0..1 real mic RMS
  busy: boolean;
  recordingMs: number;
  onStart: () => void;
  onStop: () => void;
};

const R = 34;
const CIRC = 2 * Math.PI * R;

/**
 * The delegate's microphone key. Held, not toggled, exactly as it is at the desk.
 * The ring is a level arc driven by real RMS, so the only moving thing on the
 * console reports something true.
 */
export function TalkKey({ status, level, busy, recordingMs, onStart, onStop }: Props) {
  const activeId = useRef<number | null>(null);
  const spaceDown = useRef(false);
  const recording = status === "recording";
  const working = status === "encoding" || busy;

  const down = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (working || activeId.current !== null) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    activeId.current = e.pointerId;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    onStart();
  }, [working, onStart]);

  const up = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (activeId.current !== e.pointerId) return;
    activeId.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    onStop();
  }, [onStop]);

  useEffect(() => {
    const typing = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      return !!el && (el.tagName === "TEXTAREA" || el.tagName === "INPUT" || el.isContentEditable);
    };
    const kd = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || spaceDown.current || typing(e.target)) return;
      e.preventDefault(); spaceDown.current = true; onStart();
    };
    const ku = (e: KeyboardEvent) => {
      if (e.code !== "Space" || !spaceDown.current) return;
      e.preventDefault(); spaceDown.current = false; onStop();
    };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, [onStart, onStop]);

  return (
    <div className="vx-deck pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-2.5 pt-10 pb-7">
      <div className="h-4 font-mono text-[11px] tabular-nums">
        {recording ? (
          <span className="relative text-[var(--color-live-text)]">
            MIC LIVE {(recordingMs / 1000).toFixed(1)}s · release to send
          </span>
        ) : working ? (
          <span className="relative text-[var(--color-engrave-dim)]">patching channels</span>
        ) : (
          <span className="relative text-[var(--color-engrave-faint)]">hold to talk · or hold Space</span>
        )}
      </div>

      <button
        type="button"
        aria-label={recording ? "Release to send" : "Hold to talk"}
        aria-pressed={recording}
        disabled={working}
        onPointerDown={down}
        onPointerUp={up}
        onPointerCancel={up}
        onLostPointerCapture={up}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        className="group pointer-events-auto relative grid size-[84px] place-items-center rounded-full transition-transform duration-100 active:translate-y-[2px] disabled:cursor-wait"
        style={{
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* Machined key body: lit top bevel, dark seat below. */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background: recording
              ? "linear-gradient(180deg, #F07A55 0%, var(--color-live) 55%, #A83A1C 100%)"
              : "linear-gradient(180deg, var(--color-bevel-lit) 0%, var(--color-panel-raised) 48%, #0E2023 100%)",
            boxShadow: recording
              ? "0 2px 0 #8C2F16, 0 10px 22px rgba(228,87,46,0.30), inset 0 1px 0 rgba(255,255,255,0.30)"
              : "0 3px 0 #0A1719, 0 10px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.16)",
          }}
        />

        {/* Level arc: real RMS, not an animation. */}
        <svg
          aria-hidden
          viewBox="0 0 84 84"
          className="absolute inset-0 size-full -rotate-90"
        >
          <circle
            cx="42" cy="42" r={R} fill="none"
            stroke="rgba(255,255,255,0.10)" strokeWidth="2"
          />
          {recording && (
            <circle
              cx="42" cy="42" r={R} fill="none"
              stroke="#FFD9C9" strokeWidth="2" strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - Math.min(1, level))}
              style={{ transition: "stroke-dashoffset 90ms linear" }}
            />
          )}
        </svg>

        <span className="relative text-[var(--color-engrave)]">
          {working ? (
            <Loader2 className="size-6 animate-spin" aria-hidden style={{ pointerEvents: "none" }} />
          ) : (
            <Mic className="size-6" aria-hidden style={{ pointerEvents: "none" }} />
          )}
        </span>
      </button>
    </div>
  );
}
