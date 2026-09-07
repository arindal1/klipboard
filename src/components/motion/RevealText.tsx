"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * Splits `text` into one <span> per word and animates them in on mount -
 * an "idle-in" entrance rather than a scroll trigger, for hero headlines.
 * Falls back to a static render under prefers-reduced-motion.
 */
export function RevealText({
  text,
  as: Tag = "span",
  className,
  delay = 0,
}: {
  text: string;
  as?: "span" | "h1" | "h2" | "p";
  className?: string;
  delay?: number;
}) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    const words = root.querySelectorAll<HTMLElement>("[data-reveal-word]");
    const ctx = gsap.context(() => {
      gsap.fromTo(
        words,
        { yPercent: 120, opacity: 0, rotate: 3 },
        {
          yPercent: 0,
          opacity: 1,
          rotate: 0,
          duration: 0.9,
          ease: "expo.out",
          stagger: 0.06,
          delay,
        }
      );
    }, root);

    return () => ctx.revert();
  }, [text, delay]);

  return (
    <Tag ref={rootRef as never} className={className}>
      {text.split(" ").map((word, i) => (
        <span key={i} className="reveal-word-wrap">
          <span data-reveal-word className="reveal-word">
            {word}
            {i < text.split(" ").length - 1 ? "\u00A0" : ""}
          </span>
        </span>
      ))}
      <style>{`
        .reveal-word-wrap { display: inline-block; overflow: hidden; vertical-align: top; }
        .reveal-word { display: inline-block; will-change: transform; }
      `}</style>
    </Tag>
  );
}