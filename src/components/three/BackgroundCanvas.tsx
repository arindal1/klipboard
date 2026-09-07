"use client";

import { useSyncExternalStore, type RefObject } from "react";
import dynamic from "next/dynamic";

const NeumorphicBackground = dynamic(() => import("./NeumorphicBackground"), {
  ssr: false,
});

function subscribe(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Server/first-paint snapshot: assume reduced motion so SSR and the initial
// client render agree (no WebGL canvas) until hydration confirms otherwise.
function getServerSnapshot() {
  return true;
}

/**
 * Drop-in generative background for any page. Renders the live R3F scene,
 * or a static CSS gradient under prefers-reduced-motion / when the client
 * hasn't mounted yet, so there's never a flash of unstyled background.
 * `activityRef` (from `useTypingActivity`) lets the shader react to
 * typing without triggering re-renders here.
 */
export function BackgroundCanvas({
  intensity = 1,
  activityRef,
}: {
  intensity?: number;
  activityRef?: RefObject<number>;
}) {
  const reducedMotion = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (reducedMotion) {
    return <div className="bg-fallback" aria-hidden />;
  }

  return <NeumorphicBackground intensity={intensity} activityRef={activityRef} />;
}