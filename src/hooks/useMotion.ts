"use client";
import { useEffect, useRef } from "react";

/**
 * anime.js, loaded lazily on the client and skipped entirely under
 * prefers-reduced-motion. Three moments only, each of which reports something:
 * channels dealing in as their API call lands, the strike rule drawing itself
 * across a removed word, and readouts counting to their value.
 */
export function useReducedMotion() {
  const reduced = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = mq.matches;
    const on = () => { reduced.current = mq.matches; };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

type AnimateFn = (targets: unknown, params: Record<string, unknown>) => unknown;
let animatePromise: Promise<AnimateFn | null> | null = null;

function getAnimate(): Promise<AnimateFn | null> {
  if (!animatePromise) {
    animatePromise = import("animejs")
      .then((m) => (m.animate as unknown as AnimateFn) ?? null)
      .catch(() => null);
  }
  return animatePromise;
}

/** Deal a channel in: it lifts into place as its response lands. */
export function useDealIn(enabled: boolean, index: number) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    el.style.opacity = "0";
    void getAnimate().then((animate) => {
      if (cancelled || !animate) { el.style.opacity = "1"; return; }
      animate(el, {
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 460,
        delay: Math.min(index, 7) * 55,
        ease: "out(3)",
      });
    });
    return () => { cancelled = true; el.style.opacity = "1"; };
  }, [enabled, index]);
  return ref;
}

/** Draw the strike rule across each removed word, left to right, in order. */
export function useStrikeDraw(deps: unknown) {
  const ref = useRef<HTMLParagraphElement | null>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const marks = Array.from(root.querySelectorAll<HTMLElement>(".struck"));
    if (!marks.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    marks.forEach((m) => m.style.setProperty("--draw", "0"));
    void getAnimate().then((animate) => {
      if (cancelled || !animate) { marks.forEach((m) => m.style.removeProperty("--draw")); return; }
      marks.forEach((m, i) => {
        animate(m, { "--draw": [0, 1], duration: 300, delay: 420 + i * 110, ease: "inOut(2)" });
      });
    });
    return () => { cancelled = true; marks.forEach((m) => m.style.removeProperty("--draw")); };
  }, [deps]);
  return ref;
}

/** Count a readout to its value, so the number arrives rather than appearing. */
export function useCountUp(value: number, decimals = 0) {
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const show = (n: number) => { el.textContent = n.toFixed(decimals); };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { show(value); return; }
    let cancelled = false;
    const state = { n: 0 };
    void getAnimate().then((animate) => {
      if (cancelled || !animate) { show(value); return; }
      animate(state, {
        n: value, duration: 700, ease: "out(3)",
        onUpdate: () => show(state.n),
      });
    });
    return () => { cancelled = true; };
  }, [value, decimals]);
  return ref;
}
