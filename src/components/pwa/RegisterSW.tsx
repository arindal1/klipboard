"use client";

import { useEffect } from "react";

/**
 * Registers the offline-shell service worker in production only. Client
 * component with no visual output - mounted once from the root layout.
 */
export function RegisterSW() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      typeof window === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Installability is a progressive enhancement - ignore failures.
    });
  }, []);

  return null;
}