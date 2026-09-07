"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * Small animated illustration + message shown when a user has zero
 * notepads. Mount-triggered entrance plus a slow idle float, both skipped
 * under prefers-reduced-motion (renders static).
 */
export function EmptyState({ message, tip }: { message: string; tip?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-empty-pen]",
        { y: -6, rotate: -8, opacity: 0 },
        { y: 0, rotate: 0, opacity: 1, duration: 0.8, ease: "expo.out" }
      );
      gsap.to("[data-empty-pen]", {
        y: -4,
        duration: 1.6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 0.8,
      });
    }, svgRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="empty-state">
      <svg ref={svgRef} width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden>
        <rect x="14" y="10" width="44" height="52" rx="8" fill="var(--surface-sunken)" stroke="var(--line)" />
        <line x1="22" y1="24" x2="50" y2="24" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" />
        <line x1="22" y1="34" x2="50" y2="34" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" />
        <line x1="22" y1="44" x2="38" y2="44" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" />
        <g data-empty-pen>
          <rect x="46" y="6" width="8" height="28" rx="4" fill="var(--accent)" transform="rotate(35 50 20)" />
        </g>
      </svg>
      <p className="empty-state__msg">{message}</p>
      {tip && <p className="empty-state__tip">{tip}</p>}
      <style>{`
        .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px 10px; text-align: center; }
        .empty-state__msg { color: var(--muted); font-size: 0.85rem; margin: 0; }
        .empty-state__tip { color: var(--accent); font-size: 0.75rem; margin: 0; opacity: 0.85; }
      `}</style>
    </div>
  );
}