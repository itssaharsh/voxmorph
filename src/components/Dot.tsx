"use client";
import type { Tint } from "@/config/audiences";

const HUE: Record<string, string> = {
  floor: "#FFFFFF",
  amber: "var(--color-gold)",
  blue: "var(--color-cyan)",
  green: "var(--color-mint)",
  purple: "var(--color-violet)",
  cyan: "#7DD3FC",
  rose: "var(--color-rose)",
  custom: "var(--color-ember)",
};
export const hueOf = (tint: Tint | string) => HUE[tint] ?? HUE.amber;

export function Dot({ tint, size = 8, muted = false }: { tint: Tint | string; size?: number; muted?: boolean }) {
  const c = hueOf(tint);
  return (
    <span aria-hidden className="inline-block shrink-0 rounded-full"
      style={{
        width: size, height: size,
        background: muted ? "rgba(255,255,255,0.22)" : c,
        boxShadow: muted ? "none" : `0 0 12px ${c}, 0 0 3px ${c}`,
      }} />
  );
}
