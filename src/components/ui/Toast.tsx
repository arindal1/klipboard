"use client";

import { AnimatePresence, motion } from "framer-motion";
import { gentleSpring } from "@/lib/motion";

export type ToastItem = { id: string; message: string; kind?: "success" | "error" };

/**
 * Fixed-position toast stack. Success toasts get a checkmark-pulse
 * micro-interaction (gentleSpring) - used for the save-confirmation
 * feedback pattern.
 */
export function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="toast-stack" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className={t.kind === "error" ? "toast toast--error" : "toast"}
            initial={{ opacity: 0, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={gentleSpring}
          >
            {t.kind !== "error" && (
              <motion.svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ ...gentleSpring, delay: 0.05 }}
                aria-hidden
              >
                <path
                  d="M3 8.5L6.5 12L13 4.5"
                  stroke="var(--accent-ink)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>
            )}
            <span>{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
      <style>{`
        .toast-stack { position: fixed; bottom: 24px; right: 24px; z-index: 50; display: flex; flex-direction: column; gap: 8px; align-items: flex-end; }
        .toast { display: flex; align-items: center; gap: 8px; background: var(--accent); color: var(--accent-ink); padding: 10px 16px; border-radius: 999px; font-size: 0.85rem; font-weight: 600; box-shadow: 0 8px 24px rgba(126,242,201,0.25); }
        .toast--error { background: #2a1418; color: #ff8f8f; box-shadow: var(--shadow-out); }
      `}</style>
    </div>
  );
}