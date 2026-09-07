"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * Staggers the direct children of the returned container in on mount -
 * the RevealText per-word entrance pattern generalized to arbitrary list
 * items (e.g. notepad cards). Re-runs whenever an entry in `deps` changes,
 * so newly created items animate in too. No-ops under
 * prefers-reduced-motion.
 */
export function useStaggerReveal<T extends HTMLElement>(deps: readonly unknown[] = []) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        container.children,
        { opacity: 0, x: -16 },
        { opacity: 1, x: 0, duration: 0.5, ease: "expo.out", stagger: 0.05 }
      );
    }, container);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return containerRef;
}