"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

/**
 * Reveals every direct child matching `selector` inside the returned ref
 * as it scrolls into view - staggered fade + rise. Respects
 * prefers-reduced-motion by rendering everything visible immediately.
 */
export function useScrollReveal<T extends HTMLElement>(selector: string) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>(selector);
      items.forEach((item, i) => {
        gsap.fromTo(
          item,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "expo.out",
            delay: (i % 4) * 0.06,
            scrollTrigger: {
              trigger: item,
              start: "top 88%",
            },
          }
        );
      });
    }, container);

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [selector]);

  return containerRef;
}