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

const R = 30;
const CIRC = 2 * Math.PI * R;

/**
 * Hold to talk. At rest this is a compact pill so it takes almost no page; it
 * morphs into a ringed circle while recording, and the ring is a level arc driven
 * by real microphone RMS. One element, one width transition, no layout jump.
 */
export function TalkKey({ status, level, busy, recordingMs, onStart, onStop }: Props) {
  const activeId = useRef<number | null>(null);
  const spaceDown = useRef(false);
  const recording = status === "recording";
  const working = status === "encoding" || busy;
  const open = recording || working;

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
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pt-10 pb-5
                    [background:linear-gradient(180deg,transparent_0%,rgba(4,13,26,0.70)_45%,rgba(4,13,26,0.92)_100%)]">
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
        className="pointer-events-auto relative grid place-items-center overflow-hidden rounded-full
                   transition-[width,height,box-shadow,background] duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)]
                   active:translate-y-px disabled:cursor-wait"
        style={{
          width: open ? 72 : 168,
          height: open ? 72 : 44,
          background: working
            ? "rgba(255,255,255,0.12)"
            : recording
              ? "linear-gradient(160deg,#FF8A5B 0%,#FF6A3D 45%,#E0431C 100%)"
              : "linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))",
          border: recording ? "none" : "1px solid rgba(255,255,255,0.22)",
          backdropFilter: recording ? "none" : "blur(18px) saturate(140%)",
          WebkitBackdropFilter: recording ? "none" : "blur(18px) saturate(140%)",
          boxShadow: recording
            ? "0 0 0 8px rgba(255,106,61,0.16), 0 0 46px rgba(255,106,61,0.5)"
            : "0 6px 22px rgba(0,0,0,0.35)",
          color: recording ? "#fff" : "var(--color-text)",
        }}
      >
        {/* level ring, only while live */}
        {recording && (
          <svg aria-hidden viewBox="0 0 72 72" className="absolute inset-0 size-full -rotate-90">
            <circle cx="36" cy="36" r={R} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="2.5" />
            <circle
              cx="36" cy="36" r={R} fill="none"
              stroke="#fff" strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - Math.min(1, level))}
              style={{ transition: "stroke-dashoffset 90ms linear" }}
            />
          </svg>
        )}

        <span className="relative flex items-center gap-2 whitespace-nowrap px-4">
          {working
            ? <Loader2 className="size-5 animate-spin" aria-hidden style={{ pointerEvents: "none" }} />
            : <Mic className={recording ? "size-5" : "size-4"} aria-hidden style={{ pointerEvents: "none" }} />}
          {!open && (
            <span className="text-[13px] font-medium tracking-tight">Hold to talk</span>
          )}
          {recording && (
            <span className="sr-only">{(recordingMs / 1000).toFixed(1)} seconds</span>
          )}
        </span>
      </button>

      {/* the timer lives outside the button so the pill can stay small */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-1 font-mono text-[12px] tabular-nums transition-opacity duration-200"
        style={{ opacity: recording ? 1 : 0, color: "#FFB59B" }}
      >
        {(recordingMs / 1000).toFixed(1)}s
      </span>
    </div>
  );
}
