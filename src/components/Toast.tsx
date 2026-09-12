"use client";
import { useEffect } from "react";
import { Check, TriangleAlert } from "lucide-react";

export type ToastKind = "ok" | "warn";
export type ToastState = { id: number; kind: ToastKind; message: string } | null;

export function Toast({ toast, onDone }: { toast: ToastState; onDone: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [toast, onDone]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-36 z-50 flex justify-center px-4"
      aria-live="polite"
      aria-atomic="true"
    >
      {toast && (
        <div
          key={toast.id}
          className="vx-panel animate-lamp flex items-center gap-2 px-3.5 py-2 font-mono text-[12px] shadow-lg"
          style={{
            color: toast.kind === "ok" ? "var(--color-lamp-team)" : "var(--color-live)",
          }}
        >
          {toast.kind === "ok" ? (
            <Check className="size-3.5 shrink-0" aria-hidden />
          ) : (
            <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}
