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
      className="pointer-events-none fixed inset-x-0 bottom-32 z-50 flex justify-center px-4"
      aria-live="polite"
      aria-atomic="true"
    >
      {toast && (
        <div
          key={toast.id}
          className={`animate-rise flex items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-lg backdrop-blur ${
            toast.kind === "ok"
              ? "border-amber-500/30 bg-slate-900/90 text-amber-200"
              : "border-rose-500/30 bg-slate-900/90 text-rose-200"
          }`}
        >
          {toast.kind === "ok" ? (
            <Check className="size-4 shrink-0" aria-hidden />
          ) : (
            <TriangleAlert className="size-4 shrink-0" aria-hidden />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}
