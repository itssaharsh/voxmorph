"use client";
import { useCallback, useEffect, useRef } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import type { RecorderStatus } from "@/hooks/useRecorder";

type Props = {
  status: RecorderStatus;
  level: number;      // 0..1 real mic RMS
  busy: boolean;
  recordingMs: number;
  onStart: () => void;
  onStop: () => void;
};

const R = 38;
const CIRC = 2 * Math.PI * R;

/** Hold to talk. The ring is a level arc driven by real microphone RMS, so the
 *  one moving thing on the page is reporting something true. */
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
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-3 pt-36 pb-9
                    [background:linear-gradient(180deg,transparent_0%,rgba(6,6,11,0.55)_12%,rgba(6,6,11,0.92)_30%,var(--color-void)_46%,var(--color-void)_100%)]">
      <p className="h-5 text-[14px]">
        {recording ? (
          <span className="text-[var(--color-ember)]">
            Listening · <span className="font-mono tabular-nums">{(recordingMs / 1000).toFixed(1)}s</span>
          </span>
        ) : working ? (
          <span className="text-[var(--color-text-dim)]">Writing the channels…</span>
        ) : (
          <span className="text-[var(--color-text-faint)]">Hold to talk, or hold Space</span>
        )}
      </p>

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
        className="pointer-events-auto relative grid size-[86px] place-items-center rounded-full transition-transform duration-150 hover:scale-[1.04] active:scale-[0.97] disabled:cursor-wait"
        style={{
          touchAction: "none", userSelect: "none", WebkitUserSelect: "none",
          WebkitTouchCallout: "none", WebkitTapHighlightColor: "transparent",
          background: working ? "rgba(255,255,255,0.10)" : "linear-gradient(160deg,#FF8A5B 0%,#FF6A3D 45%,#E0431C 100%)",
          color: working ? "var(--color-text-faint)" : "#FFFFFF",
          boxShadow: working
            ? "none"
            : recording
              ? "0 0 0 10px rgba(255,106,61,0.14), 0 0 60px rgba(255,106,61,0.55), inset 0 1px 0 rgba(255,255,255,0.4)"
              : "0 0 36px rgba(255,106,61,0.40), inset 0 1px 0 rgba(255,255,255,0.35)",
        }}
      >
        <svg aria-hidden viewBox="0 0 86 86" className="absolute inset-0 size-full -rotate-90">
          {recording && (
            <circle
              cx="43" cy="43" r={R} fill="none"
              stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - Math.min(1, level))}
              style={{ transition: "stroke-dashoffset 90ms linear" }}
            />
          )}
        </svg>
        {working
          ? <Loader2 className="size-6 animate-spin" aria-hidden style={{ pointerEvents: "none" }} />
          : recording
            ? <Square className="size-5 fill-current" aria-hidden style={{ pointerEvents: "none" }} />
            : <Mic className="size-6" aria-hidden style={{ pointerEvents: "none" }} />}
      </button>
    </div>
  );
}
