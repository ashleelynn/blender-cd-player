import { useEffect, useRef, type RefObject } from "react";

type Options = {
  /** wheel distance (px) that counts as one step */
  threshold?: number;
  /** "y" listens to vertical scroll; "x" also accepts horizontal trackpad scroll */
  axis?: "x" | "y";
};

/**
 * Turns wheel, trackpad and touch scrolling on an element into single +1 / -1 steps.
 * Used by the track dial and the crate, which only move by scrolling.
 */
export function useScrollStep(ref: RefObject<HTMLElement | null>, onStep: (dir: 1 | -1) => void, { threshold = 40, axis = "y" }: Options = {}) {
  const stepRef = useRef(onStep);
  useEffect(() => {
    stepRef.current = onStep;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let acc = 0;
    let lockedUntil = 0;
    let touch: { x: number; y: number } | null = null;

    const step = (dir: 1 | -1) => {
      const now = performance.now();
      if (now < lockedUntil) return;
      lockedUntil = now + 140;
      stepRef.current(dir);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = axis === "x" && Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      acc += delta;
      if (Math.abs(acc) >= threshold) {
        step(acc > 0 ? 1 : -1);
        acc = 0;
      }
    };
    const onTouchStart = (e: TouchEvent) => {
      touch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!touch) return;
      e.preventDefault();
      const t = e.touches[0];
      const d = axis === "x" ? touch.x - t.clientX : touch.y - t.clientY;
      if (Math.abs(d) > 32) {
        step(d > 0 ? 1 : -1);
        touch = { x: t.clientX, y: t.clientY };
      }
    };
    const onTouchEnd = () => {
      touch = null;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [ref, threshold, axis]);
}
