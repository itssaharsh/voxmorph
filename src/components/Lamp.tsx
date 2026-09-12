"use client";
import type { Tint } from "@/config/audiences";

/** Channel identity is a lamp, never a tinted field. 6px, lit or dark. */
const LAMP: Record<string, string> = {
  floor: "var(--color-lamp-floor)",
  amber: "var(--color-lamp-clean)",
  blue: "var(--color-lamp-boss)",
  green: "var(--color-lamp-team)",
  purple: "var(--color-lamp-public)",
  cyan: "var(--color-lamp-tech)",
  rose: "var(--color-lamp-family)",
  wild: "var(--color-lamp-wild)",
};

export const lampColor = (tint: Tint | string) => LAMP[tint] ?? LAMP.amber;

export function Lamp({ tint, lit = true, size = 6 }: { tint: Tint | string; lit?: boolean; size?: number }) {
  const c = lampColor(tint);
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size, height: size,
        background: lit ? c : "var(--color-bevel)",
        boxShadow: lit ? `0 0 0 1px color-mix(in oklab, ${c} 30%, transparent)` : "none",
      }}
    />
  );
}
