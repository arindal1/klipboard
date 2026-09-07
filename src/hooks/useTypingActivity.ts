"use client";

import { useRef } from "react";

/**
 * Tracks recent typing activity as a decaying 0-1 value held in a ref, so
 * consumers (e.g. the WebGL background) can react per-frame without
 * triggering a React re-render on every keystroke. Call `bump()` from an
 * input's change/keydown handler; the value decays back toward 0 wherever
 * it's read (see NeumorphicBackground's per-frame decay).
 */
export function useTypingActivity() {
  const activityRef = useRef(0);

  function bump() {
    activityRef.current = 1;
  }

  return { activityRef, bump };
}