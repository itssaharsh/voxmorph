"use client";
import type { Tint } from "@/config/audiences";

/** Channel identity is a dot and a number. Never a filled field, never a
 *  coloured border: on paper those read as decoration and crowd the prose. */
const HUE: Record<string, string> = {
  floor: "var(--color-ch-floor)",
  amber: "var(--color-ch-cleaned)",
  blue: "var(--color-ch-boss)",
  green: "var(--color-ch-team)",
  purple: "var(--color-ch-public)",
  cyan: "var(--color-ch-tech)",
  rose: "var(--color-ch-family)",
  custom: "var(--color-ch-custom)",
};

export const hueOf = (tint: Tint | string) => HUE[tint] ?? HUE.amber;

export function Dot({ tint, size = 7, muted = false }: { tint: Tint | string; size?: number; muted?: boolean }) {
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: muted ? "var(--color-hairline-strong)" : hueOf(tint),
      }}
    />
  );
}
